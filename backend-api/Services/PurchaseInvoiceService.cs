using System.Data;
using Microsoft.EntityFrameworkCore;
using WeatherAPI.DTOs.PurchaseInvoice;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class PurchaseInvoiceService : IPurchaseInvoiceService
    {
        private const string StockTransactionTypePurchase = "Purchase";
        private const string PurchaseInvoicePrefix = "PI";
        private readonly AppDbContext _dbContext;
        private readonly INotificationService _notificationService;
        private readonly ILogger<PurchaseInvoiceService> _logger;

        public PurchaseInvoiceService(AppDbContext dbContext, INotificationService notificationService, ILogger<PurchaseInvoiceService> logger)
        {
            _dbContext = dbContext;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<ServiceResult<PurchaseInvoiceSummaryDto>> CreateAsync(CreatePurchaseInvoiceRequestDto request)
        {
            var invoiceDateInput = request.InvoiceDate.Date;
            if (invoiceDateInput > DateTime.Today)
            {
                return ServiceResult<PurchaseInvoiceSummaryDto>.Fail(ServiceErrorType.Validation, "Invoice date cannot be in the future.");
            }
            var invoiceDate = DateTime.SpecifyKind(invoiceDateInput, DateTimeKind.Utc);

            var invoiceNumber = request.InvoiceNumber.Trim();
            var notes = request.Notes.Trim();

            if (request.Items is null || request.Items.Count == 0)
            {
                return ServiceResult<PurchaseInvoiceSummaryDto>.Fail(ServiceErrorType.Validation, "At least one invoice item is required.");
            }

            var vendor = await _dbContext.Vendors.FirstOrDefaultAsync(v => v.VendorId == request.VendorId);
            if (vendor is null)
            {
                return ServiceResult<PurchaseInvoiceSummaryDto>.Fail(ServiceErrorType.NotFound, "Vendor not found.");
            }

            var partIds = request.Items.Select(i => i.PartId).Distinct().ToList();
            var parts = await _dbContext.VehicleParts
                .Where(p => partIds.Contains(p.PartId) && !p.IsDeleted)
                .ToDictionaryAsync(p => p.PartId);

            if (parts.Count != partIds.Count)
            {
                return ServiceResult<PurchaseInvoiceSummaryDto>.Fail(ServiceErrorType.NotFound, "One or more parts were not found.");
            }

            if (parts.Values.Any(p => p.VendorId != request.VendorId))
            {
                return ServiceResult<PurchaseInvoiceSummaryDto>.Fail(ServiceErrorType.Validation, "All purchased parts must belong to the selected vendor.");
            }

            if (request.Items.Any(i => !string.Equals(i.Condition?.Trim(), "New", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(i.Condition?.Trim(), "Refurbished", StringComparison.OrdinalIgnoreCase)))
            {
                return ServiceResult<PurchaseInvoiceSummaryDto>.Fail(ServiceErrorType.Validation, "Item condition must be New or Refurbished.");
            }

            var mismatchedConditionItem = request.Items.FirstOrDefault(i =>
            {
                var part = parts[i.PartId];
                return !string.Equals(i.Condition?.Trim(), part.Condition, StringComparison.OrdinalIgnoreCase);
            });
            if (mismatchedConditionItem is not null)
            {
                var part = parts[mismatchedConditionItem.PartId];
                return ServiceResult<PurchaseInvoiceSummaryDto>.Fail(
                    ServiceErrorType.Validation,
                    $"Condition for {part.Name} must match the selected part condition: {part.Condition}.");
            }

            var invoice = new PurchaseInvoice
            {
                InvoiceNumber = string.Empty,
                VendorId = request.VendorId,
                InvoiceDate = invoiceDate,
                Notes = notes,
                CreatedAtUtc = DateTime.UtcNow
            };

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            invoice.InvoiceNumber = string.IsNullOrWhiteSpace(invoiceNumber)
                ? await GenerateNextInvoiceNumberAsync(invoice.InvoiceDate)
                : invoiceNumber;

            var invoiceNumberExists = await _dbContext.PurchaseInvoices
                .AnyAsync(i => i.InvoiceNumber == invoice.InvoiceNumber);
            if (invoiceNumberExists)
            {
                return ServiceResult<PurchaseInvoiceSummaryDto>.Fail(ServiceErrorType.Conflict, "Invoice number already exists.");
            }

            foreach (var requestItem in request.Items)
            {
                var part = parts[requestItem.PartId];
                var quantityBefore = part.StockQuantity;
                var serverUnitCost = part.Price;
                var lineTotal = requestItem.Quantity * serverUnitCost;

                checked
                {
                    part.StockQuantity += requestItem.Quantity;
                }
                var quantityAfter = part.StockQuantity;

                invoice.Items.Add(new PurchaseInvoiceItem
                {
                    PartId = requestItem.PartId,
                    Quantity = requestItem.Quantity,
                    UnitCost = serverUnitCost,
                    LineTotal = lineTotal
                });

                _dbContext.StockTransactions.Add(new StockTransaction
                {
                    PartId = requestItem.PartId,
                    QuantityChange = requestItem.Quantity,
                    QuantityBefore = quantityBefore,
                    QuantityAfter = quantityAfter,
                    TransactionType = StockTransactionTypePurchase,
                    ReferenceNumber = invoice.InvoiceNumber,
                    SalesInvoiceId = null,
                    CreatedAtUtc = DateTime.UtcNow
                });

                invoice.TotalAmount += lineTotal;
            }

            _dbContext.PurchaseInvoices.Add(invoice);
            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            await TryCreateLowStockNotificationsAsync(invoice.InvoiceNumber);

            _logger.LogInformation("Purchase invoice created: {InvoiceNumber} for VendorId {VendorId} with {ItemCount} items.",
                invoice.InvoiceNumber,
                invoice.VendorId,
                invoice.Items.Count);

            return await GetByIdAsync(invoice.PurchaseInvoiceId);
        }

        private async Task TryCreateLowStockNotificationsAsync(string invoiceNumber)
        {
            try
            {
                var notificationResult = await _notificationService.CheckLowStockAsync();
                if (!notificationResult.Success)
                {
                    _logger.LogWarning("Low stock notification check failed after purchase invoice {InvoiceNumber}: {Message}",
                        invoiceNumber,
                        notificationResult.Error?.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Low stock notification check failed after purchase invoice {InvoiceNumber}.", invoiceNumber);
            }
        }

        public async Task<ServiceResult<IReadOnlyList<PurchaseInvoiceSummaryDto>>> GetAllAsync()
        {
            var invoices = await _dbContext.PurchaseInvoices
                .AsNoTracking()
                .Include(i => i.Vendor)
                .Include(i => i.Items)
                    .ThenInclude(item => item.VehiclePart)
                        .ThenInclude(part => part.PartImages)
                .OrderByDescending(i => i.InvoiceDate)
                .ThenByDescending(i => i.PurchaseInvoiceId)
                .ToListAsync();

            return ServiceResult<IReadOnlyList<PurchaseInvoiceSummaryDto>>.Ok(invoices.Select(MapToSummary).ToList());
        }

        public async Task<ServiceResult<PurchaseInvoiceSummaryDto>> GetByIdAsync(int purchaseInvoiceId)
        {
            var invoice = await _dbContext.PurchaseInvoices
                .AsNoTracking()
                .Include(i => i.Vendor)
                .Include(i => i.Items)
                    .ThenInclude(item => item.VehiclePart)
                        .ThenInclude(part => part.PartImages)
                .FirstOrDefaultAsync(i => i.PurchaseInvoiceId == purchaseInvoiceId);

            if (invoice is null)
            {
                return ServiceResult<PurchaseInvoiceSummaryDto>.Fail(ServiceErrorType.NotFound, "Purchase invoice not found.");
            }

            return ServiceResult<PurchaseInvoiceSummaryDto>.Ok(MapToSummary(invoice));
        }

        public async Task<ServiceResult<string>> GetNextInvoiceNumberAsync(DateTime invoiceDate)
        {
            var normalizedDate = invoiceDate.Date;
            if (normalizedDate > DateTime.Today)
            {
                return ServiceResult<string>.Fail(ServiceErrorType.Validation, "Invoice date cannot be in the future.");
            }

            var number = await GenerateNextInvoiceNumberAsync(DateTime.SpecifyKind(normalizedDate, DateTimeKind.Utc));
            return ServiceResult<string>.Ok(number);
        }

        private static PurchaseInvoiceSummaryDto MapToSummary(PurchaseInvoice invoice)
        {
            return new PurchaseInvoiceSummaryDto
            {
                PurchaseInvoiceId = invoice.PurchaseInvoiceId,
                InvoiceNumber = invoice.InvoiceNumber,
                VendorId = invoice.VendorId,
                VendorName = invoice.Vendor.Name,
                VendorEmail = invoice.Vendor.Email,
                InvoiceDate = invoice.InvoiceDate,
                Notes = invoice.Notes,
                TotalAmount = invoice.TotalAmount,
                CreatedAtUtc = invoice.CreatedAtUtc,
                Items = invoice.Items
                    .OrderBy(item => item.PurchaseInvoiceItemId)
                    .Select(item => new PurchaseInvoiceItemSummaryDto
                    {
                        PurchaseInvoiceItemId = item.PurchaseInvoiceItemId,
                        PartId = item.PartId,
                        PartName = item.VehiclePart.Name,
                        ImageUrl = item.VehiclePart.PartImages
                            .OrderBy(pi => pi.ImageId)
                            .Select(pi => pi.ImageUrl)
                            .FirstOrDefault() ?? string.Empty,
                        Quantity = item.Quantity,
                        UnitCost = item.UnitCost,
                        LineTotal = item.LineTotal
                    })
                    .ToList()
            };
        }

        private async Task<string> GenerateNextInvoiceNumberAsync(DateTime invoiceDateUtc)
        {
            var date = invoiceDateUtc.Date;
            var prefix = $"{PurchaseInvoicePrefix}-{date:yyyyMMdd}-";

            var existingNumbers = await _dbContext.PurchaseInvoices
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
    }
}
