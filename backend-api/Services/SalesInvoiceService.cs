using System.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WeatherAPI.DTOs.SalesInvoice;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class SalesInvoiceService : ISalesInvoiceService
    {
        private const string SalesInvoicePrefix = "SI";
        private const string StockTransactionTypeSale = "Sale";
        private const string PaymentStatusPaid = "Paid";
        private const string PaymentStatusPartial = "Partial";
        private const string PaymentStatusUnpaid = "Unpaid";
        private const decimal LoyaltyDiscountThreshold = 5000m;
        private const decimal LoyaltyDiscountRate = 0.10m;

        private readonly AppDbContext _dbContext;
        private readonly UserManager<User> _userManager;
        private readonly INotificationService _notificationService;
        private readonly ILogger<SalesInvoiceService> _logger;

        public SalesInvoiceService(
            AppDbContext dbContext,
            UserManager<User> userManager,
            INotificationService notificationService,
            ILogger<SalesInvoiceService> logger)
        {
            _dbContext = dbContext;
            _userManager = userManager;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<ServiceResult<SalesInvoiceSummaryDto>> CreateAsync(CreateSalesInvoiceRequestDto request, int staffId)
        {
            var saleDateInput = request.SaleDate.Date;
            if (saleDateInput > DateTime.Today)
            {
                return ServiceResult<SalesInvoiceSummaryDto>.Fail(ServiceErrorType.Validation, "Sale date cannot be in the future.");
            }
            var saleDate = DateTime.SpecifyKind(saleDateInput, DateTimeKind.Utc);
            var invoiceNumberInput = request.InvoiceNumber.Trim();

            if (request.Items is null || request.Items.Count == 0)
            {
                return ServiceResult<SalesInvoiceSummaryDto>.Fail(ServiceErrorType.Validation, "At least one invoice item is required.");
            }

            if (request.PaidAmount.HasValue && request.PaidAmount.Value < 0)
            {
                return ServiceResult<SalesInvoiceSummaryDto>.Fail(ServiceErrorType.Validation, "Paid amount cannot be negative.");
            }

            var staff = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == staffId);
            if (staff is null || !await _userManager.IsInRoleAsync(staff, "Staff") && !await _userManager.IsInRoleAsync(staff, "Admin"))
            {
                return ServiceResult<SalesInvoiceSummaryDto>.Fail(ServiceErrorType.NotFound, "Staff not found.");
            }

            var customer = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == request.CustomerId);
            if (customer is null || !await _userManager.IsInRoleAsync(customer, "Customer"))
            {
                return ServiceResult<SalesInvoiceSummaryDto>.Fail(ServiceErrorType.NotFound, "Customer not found.");
            }

            var partIds = request.Items.Select(i => i.PartId).Distinct().ToList();
            var parts = await _dbContext.VehicleParts
                .Where(p => partIds.Contains(p.PartId) && !p.IsDeleted)
                .ToDictionaryAsync(p => p.PartId);

            if (parts.Count != partIds.Count)
            {
                return ServiceResult<SalesInvoiceSummaryDto>.Fail(ServiceErrorType.NotFound, "One or more parts were not found.");
            }

            var requestedQuantities = request.Items
                .GroupBy(i => i.PartId)
                .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantity));

            foreach (var requestedQuantity in requestedQuantities)
            {
                var part = parts[requestedQuantity.Key];
                if (requestedQuantity.Value > part.StockQuantity)
                {
                    return ServiceResult<SalesInvoiceSummaryDto>.Fail(
                        ServiceErrorType.Validation,
                        $"Insufficient stock for {part.Name}. Available stock is {part.StockQuantity}.");
                }
            }

            var invoice = new SalesInvoice
            {
                InvoiceNumber = string.Empty,
                CustomerId = request.CustomerId,
                StaffId = staffId,
                SaleDate = saleDate,
                CreatedAtUtc = DateTime.UtcNow
            };

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            invoice.InvoiceNumber = string.IsNullOrWhiteSpace(invoiceNumberInput)
                ? await GenerateNextInvoiceNumberAsync(invoice.SaleDate)
                : invoiceNumberInput;

            var invoiceNumberExists = await _dbContext.SalesInvoices
                .AnyAsync(i => i.InvoiceNumber == invoice.InvoiceNumber);
            if (invoiceNumberExists)
            {
                return ServiceResult<SalesInvoiceSummaryDto>.Fail(ServiceErrorType.Conflict, "Invoice number already exists.");
            }

            foreach (var requestItem in request.Items)
            {
                var part = parts[requestItem.PartId];
                var quantityBefore = part.StockQuantity;
                var quantityAfter = quantityBefore - requestItem.Quantity;
                var serverUnitPrice = part.Price;
                var lineTotal = requestItem.Quantity * serverUnitPrice;

                part.StockQuantity = quantityAfter;

                invoice.Items.Add(new SalesInvoiceItem
                {
                    PartId = requestItem.PartId,
                    Quantity = requestItem.Quantity,
                    UnitPrice = serverUnitPrice,
                    LineTotal = lineTotal
                });

                invoice.StockTransactions.Add(new StockTransaction
                {
                    PartId = requestItem.PartId,
                    QuantityChange = -requestItem.Quantity,
                    QuantityBefore = quantityBefore,
                    QuantityAfter = quantityAfter,
                    TransactionType = StockTransactionTypeSale,
                    ReferenceNumber = invoice.InvoiceNumber,
                    CreatedAtUtc = DateTime.UtcNow
                });

                invoice.Subtotal += lineTotal;
            }

            invoice.Discount = CalculateLoyaltyDiscount(invoice.Subtotal);
            invoice.FinalTotal = invoice.Subtotal - invoice.Discount;
            var paymentResult = ApplyPaymentDetails(invoice, request);
            if (!paymentResult.Success)
            {
                return ServiceResult<SalesInvoiceSummaryDto>.Fail(
                    paymentResult.Error!.Type,
                    paymentResult.Error.Message);
            }

            _dbContext.SalesInvoices.Add(invoice);
            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            await TryCreateLowStockNotificationsAsync(invoice.InvoiceNumber);

            _logger.LogInformation("Sales invoice created: {InvoiceNumber} by StaffId {StaffId} for CustomerId {CustomerId}.",
                invoice.InvoiceNumber,
                invoice.StaffId,
                invoice.CustomerId);

            return await GetByIdAsync(invoice.SalesInvoiceId);
        }

        public async Task<ServiceResult<IReadOnlyList<SalesInvoiceSummaryDto>>> GetAllAsync()
        {
            var invoices = await _dbContext.SalesInvoices
                .AsNoTracking()
                .Include(i => i.Customer)
                .Include(i => i.Staff)
                .Include(i => i.Items)
                    .ThenInclude(item => item.VehiclePart)
                .OrderByDescending(i => i.SaleDate)
                .ThenByDescending(i => i.SalesInvoiceId)
                .ToListAsync();

            return ServiceResult<IReadOnlyList<SalesInvoiceSummaryDto>>.Ok(invoices.Select(MapToSummary).ToList());
        }

        public async Task<ServiceResult<SalesInvoiceSummaryDto>> GetByIdAsync(int salesInvoiceId)
        {
            var invoice = await _dbContext.SalesInvoices
                .AsNoTracking()
                .Include(i => i.Customer)
                .Include(i => i.Staff)
                .Include(i => i.Items)
                    .ThenInclude(item => item.VehiclePart)
                .FirstOrDefaultAsync(i => i.SalesInvoiceId == salesInvoiceId);

            if (invoice is null)
            {
                return ServiceResult<SalesInvoiceSummaryDto>.Fail(ServiceErrorType.NotFound, "Sales invoice not found.");
            }

            return ServiceResult<SalesInvoiceSummaryDto>.Ok(MapToSummary(invoice));
        }

        public async Task<ServiceResult<string>> GetNextInvoiceNumberAsync(DateTime saleDate)
        {
            var normalizedDate = saleDate.Date;
            if (normalizedDate > DateTime.Today)
            {
                return ServiceResult<string>.Fail(ServiceErrorType.Validation, "Sale date cannot be in the future.");
            }

            var number = await GenerateNextInvoiceNumberAsync(DateTime.SpecifyKind(normalizedDate, DateTimeKind.Utc));
            return ServiceResult<string>.Ok(number);
        }

        private static SalesInvoiceSummaryDto MapToSummary(SalesInvoice invoice)
        {
            return new SalesInvoiceSummaryDto
            {
                SalesInvoiceId = invoice.SalesInvoiceId,
                InvoiceNumber = invoice.InvoiceNumber,
                CustomerId = invoice.CustomerId,
                CustomerName = invoice.Customer.Name,
                StaffId = invoice.StaffId,
                StaffName = invoice.Staff.Name,
                SaleDate = invoice.SaleDate,
                Subtotal = invoice.Subtotal,
                Discount = invoice.Discount,
                FinalTotal = invoice.FinalTotal,
                PaidAmount = invoice.PaidAmount,
                CreditAmount = invoice.FinalTotal - invoice.PaidAmount,
                PaymentStatus = invoice.PaymentStatus,
                CreditDueDate = invoice.CreditDueDate,
                LastCreditReminderSentAtUtc = invoice.LastCreditReminderSentAtUtc,
                CreatedAtUtc = invoice.CreatedAtUtc,
                Items = invoice.Items
                    .OrderBy(item => item.SalesInvoiceItemId)
                    .Select(item => new SalesInvoiceItemSummaryDto
                    {
                        SalesInvoiceItemId = item.SalesInvoiceItemId,
                        PartId = item.PartId,
                        PartName = item.VehiclePart.Name,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        LineTotal = item.LineTotal
                    })
                    .ToList()
            };
        }

        private static decimal CalculateLoyaltyDiscount(decimal subtotal)
        {
            return subtotal > LoyaltyDiscountThreshold
                ? decimal.Round(subtotal * LoyaltyDiscountRate, 2, MidpointRounding.AwayFromZero)
                : 0m;
        }

        private static ServiceResult<bool> ApplyPaymentDetails(SalesInvoice invoice, CreateSalesInvoiceRequestDto request)
        {
            var paidAmount = request.PaidAmount ?? invoice.FinalTotal;
            if (paidAmount > invoice.FinalTotal)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.Validation, "Paid amount cannot be greater than invoice total.");
            }
            invoice.PaidAmount = paidAmount;
            invoice.PaymentStatus = GetPaymentStatus(invoice.FinalTotal, invoice.PaidAmount);

            if (invoice.PaymentStatus == PaymentStatusPaid)
            {
                invoice.CreditDueDate = null;
                return ServiceResult<bool>.Ok(true);
            }

            var creditDueDate = request.CreditDueDate.HasValue
                ? NormalizeUtc(request.CreditDueDate.Value)
                : invoice.SaleDate.AddMonths(1);

            if (creditDueDate < invoice.SaleDate)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.Validation, "Credit due date cannot be before the sale date.");
            }

            invoice.CreditDueDate = creditDueDate;
            return ServiceResult<bool>.Ok(true);
        }

        private static string GetPaymentStatus(decimal finalTotal, decimal paidAmount)
        {
            if (paidAmount >= finalTotal)
            {
                return PaymentStatusPaid;
            }

            return paidAmount == 0m ? PaymentStatusUnpaid : PaymentStatusPartial;
        }

        private static DateTime NormalizeUtc(DateTime value)
        {
            return value.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
                : value.ToUniversalTime();
        }

        private async Task<string> GenerateNextInvoiceNumberAsync(DateTime saleDateUtc)
        {
            var date = saleDateUtc.Date;
            var prefix = $"{SalesInvoicePrefix}-{date:yyyyMMdd}-";

            var existingNumbers = await _dbContext.SalesInvoices
                .AsNoTracking()
                .Where(i => i.InvoiceNumber.StartsWith(prefix))
                .Select(i => i.InvoiceNumber)
                .ToListAsync();

            var maxSequence = 0;
            foreach (var number in existingNumbers)
            {
                if (number.Length <= prefix.Length)
                {
                    continue;
                }

                var suffix = number[prefix.Length..];
                if (int.TryParse(suffix, out var parsedSequence) && parsedSequence > maxSequence)
                {
                    maxSequence = parsedSequence;
                }
            }

            return $"{prefix}{(maxSequence + 1):D4}";
        }

        private async Task TryCreateLowStockNotificationsAsync(string invoiceNumber)
        {
            try
            {
                var notificationResult = await _notificationService.CheckLowStockAsync();
                if (!notificationResult.Success)
                {
                    _logger.LogWarning("Low stock notification check failed after sales invoice {InvoiceNumber}: {Message}",
                        invoiceNumber,
                        notificationResult.Error?.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Low stock notification check failed after sales invoice {InvoiceNumber}.", invoiceNumber);
            }
        }
    }
}
