using Microsoft.EntityFrameworkCore;
using WeatherAPI.DTOs.Reports;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class ReportService : IReportService
    {
        private const int RegularCustomerMinimumInvoiceCount = 2;
        private const decimal HighSpenderMinimumSpend = 5000m;

        private readonly AppDbContext _dbContext;

        public ReportService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Task<ServiceResult<FinancialReportDto>> GetDailyFinancialReportAsync(DateTime date)
        {
            var startDateUtc = NormalizeUtcDate(date);
            var endDateUtc = startDateUtc.AddDays(1);
            return BuildFinancialReportAsync("Daily", startDateUtc.ToString("yyyy-MM-dd"), startDateUtc, endDateUtc);
        }

        public Task<ServiceResult<FinancialReportDto>> GetMonthlyFinancialReportAsync(int year, int month)
        {
            if (year < 2000 || year > 2100)
            {
                return Task.FromResult(ServiceResult<FinancialReportDto>.Fail(ServiceErrorType.Validation, "Year must be between 2000 and 2100."));
            }

            if (month < 1 || month > 12)
            {
                return Task.FromResult(ServiceResult<FinancialReportDto>.Fail(ServiceErrorType.Validation, "Month must be between 1 and 12."));
            }

            var startDateUtc = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDateUtc = startDateUtc.AddMonths(1);
            return BuildFinancialReportAsync("Monthly", startDateUtc.ToString("yyyy-MM"), startDateUtc, endDateUtc);
        }

        public Task<ServiceResult<FinancialReportDto>> GetYearlyFinancialReportAsync(int year)
        {
            if (year < 2000 || year > 2100)
            {
                return Task.FromResult(ServiceResult<FinancialReportDto>.Fail(ServiceErrorType.Validation, "Year must be between 2000 and 2100."));
            }

            var startDateUtc = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDateUtc = startDateUtc.AddYears(1);
            return BuildFinancialReportAsync("Yearly", year.ToString(), startDateUtc, endDateUtc);
        }

        public async Task<ServiceResult<IReadOnlyList<CustomerReportDto>>> GetRegularCustomersAsync()
        {
            var rows = await GetCustomerInvoiceRowsAsync();
            var vehicleCounts = await GetVehicleCountsAsync(rows.Select(r => r.CustomerId).Distinct().ToList());

            var customers = rows
                .GroupBy(r => r.CustomerId)
                .Select(g => BuildCustomerReport(g, vehicleCounts))
                .Where(c => c.InvoiceCount >= RegularCustomerMinimumInvoiceCount)
                .OrderByDescending(c => c.InvoiceCount)
                .ThenByDescending(c => c.LastPurchaseDateUtc)
                .ThenBy(c => c.CustomerName)
                .ToList();

            return ServiceResult<IReadOnlyList<CustomerReportDto>>.Ok(customers);
        }

        public async Task<ServiceResult<IReadOnlyList<CustomerReportDto>>> GetHighSpendersAsync()
        {
            var rows = await GetCustomerInvoiceRowsAsync();
            var vehicleCounts = await GetVehicleCountsAsync(rows.Select(r => r.CustomerId).Distinct().ToList());

            var customers = rows
                .GroupBy(r => r.CustomerId)
                .Select(g => BuildCustomerReport(g, vehicleCounts))
                .Where(c => c.TotalSpend >= HighSpenderMinimumSpend)
                .OrderByDescending(c => c.TotalSpend)
                .ThenByDescending(c => c.InvoiceCount)
                .ThenBy(c => c.CustomerName)
                .ToList();

            return ServiceResult<IReadOnlyList<CustomerReportDto>>.Ok(customers);
        }

        public async Task<ServiceResult<IReadOnlyList<PendingCreditCustomerReportDto>>> GetPendingCreditCustomersAsync()
        {
            var rows = await GetCustomerInvoiceRowsAsync();
            var pendingRows = rows
                .Where(r => r.CreditAmount > 0)
                .ToList();
            var allRowsByCustomer = rows
                .GroupBy(r => r.CustomerId)
                .ToDictionary(g => g.Key, g => g.ToList());
            var vehicleCounts = await GetVehicleCountsAsync(pendingRows.Select(r => r.CustomerId).Distinct().ToList());
            var nowUtc = DateTime.UtcNow;

            var customers = pendingRows
                .GroupBy(r => r.CustomerId)
                .Select(g => BuildPendingCreditCustomerReport(g, allRowsByCustomer[g.Key], vehicleCounts, nowUtc))
                .OrderByDescending(c => c.TotalCreditAmount)
                .ThenBy(c => c.OldestCreditDueDateUtc)
                .ThenBy(c => c.CustomerName)
                .ToList();

            return ServiceResult<IReadOnlyList<PendingCreditCustomerReportDto>>.Ok(customers);
        }

        public async Task<ServiceResult<IReadOnlyList<PendingCreditCustomerReportDto>>> GetOverdueCreditCustomersAsync()
        {
            var nowUtc = DateTime.UtcNow;
            var rows = await GetCustomerInvoiceRowsAsync();
            var overdueRows = rows
                .Where(r => r.CreditAmount > 0 && r.CreditDueDate.HasValue && r.CreditDueDate.Value <= nowUtc)
                .ToList();
            var allRowsByCustomer = rows
                .GroupBy(r => r.CustomerId)
                .ToDictionary(g => g.Key, g => g.ToList());
            var vehicleCounts = await GetVehicleCountsAsync(overdueRows.Select(r => r.CustomerId).Distinct().ToList());

            var customers = overdueRows
                .GroupBy(r => r.CustomerId)
                .Select(g => BuildPendingCreditCustomerReport(g, allRowsByCustomer[g.Key], vehicleCounts, nowUtc))
                .OrderByDescending(c => c.OverdueCreditAmount)
                .ThenBy(c => c.OldestCreditDueDateUtc)
                .ThenBy(c => c.CustomerName)
                .ToList();

            return ServiceResult<IReadOnlyList<PendingCreditCustomerReportDto>>.Ok(customers);
        }

        private async Task<ServiceResult<FinancialReportDto>> BuildFinancialReportAsync(
            string reportType,
            string periodLabel,
            DateTime startDateUtc,
            DateTime endDateUtc)
        {
            var salesInvoices = await _dbContext.SalesInvoices
                .AsNoTracking()
                .Where(i => i.SaleDate >= startDateUtc && i.SaleDate < endDateUtc)
                .Select(i => new
                {
                    i.FinalTotal,
                    i.PaidAmount,
                    i.Discount,
                    i.PaymentStatus
                })
                .ToListAsync();

            var purchaseInvoices = await _dbContext.PurchaseInvoices
                .AsNoTracking()
                .Where(i => i.InvoiceDate >= startDateUtc && i.InvoiceDate < endDateUtc)
                .Select(i => new
                {
                    i.TotalAmount
                })
                .ToListAsync();

            var salesIncome = salesInvoices.Sum(i => i.FinalTotal);
            var purchaseCost = purchaseInvoices.Sum(i => i.TotalAmount);
            var paidSales = salesInvoices.Sum(i => i.PaidAmount);
            var creditSales = salesInvoices.Sum(i => Math.Max(i.FinalTotal - i.PaidAmount, 0m));
            var salesInvoiceCount = salesInvoices.Count;

            var report = new FinancialReportDto
            {
                ReportType = reportType,
                PeriodLabel = periodLabel,
                StartDateUtc = startDateUtc,
                EndDateUtc = endDateUtc,
                SalesIncome = salesIncome,
                PurchaseCost = purchaseCost,
                TotalRevenue = salesIncome,
                TotalExpenses = purchaseCost,
                TotalProfit = salesIncome - purchaseCost,
                PaidSales = paidSales,
                CreditSales = creditSales,
                DiscountTotal = salesInvoices.Sum(i => i.Discount),
                SalesInvoiceCount = salesInvoiceCount,
                PurchaseInvoiceCount = purchaseInvoices.Count,
                TotalInvoiceCount = salesInvoiceCount + purchaseInvoices.Count,
                PaidSalesInvoiceCount = salesInvoices.Count(i => i.PaymentStatus == "Paid"),
                CreditSalesInvoiceCount = salesInvoices.Count(i => i.FinalTotal > i.PaidAmount),
                AverageSalesInvoiceValue = salesInvoiceCount == 0 ? 0m : decimal.Round(salesIncome / salesInvoiceCount, 2, MidpointRounding.AwayFromZero)
            };

            return ServiceResult<FinancialReportDto>.Ok(report);
        }

        private async Task<IReadOnlyList<CustomerInvoiceReportRow>> GetCustomerInvoiceRowsAsync()
        {
            return await _dbContext.SalesInvoices
                .AsNoTracking()
                .Select(i => new CustomerInvoiceReportRow
                {
                    CustomerId = i.CustomerId,
                    CustomerName = i.Customer.Name,
                    Email = i.Customer.Email ?? string.Empty,
                    PhoneNumber = i.Customer.PhoneNumber ?? string.Empty,
                    SaleDate = i.SaleDate,
                    FinalTotal = i.FinalTotal,
                    PaidAmount = i.PaidAmount,
                    CreditDueDate = i.CreditDueDate
                })
                .ToListAsync();
        }

        private async Task<IReadOnlyDictionary<int, int>> GetVehicleCountsAsync(IReadOnlyCollection<int> customerIds)
        {
            if (customerIds.Count == 0)
            {
                return new Dictionary<int, int>();
            }

            return await _dbContext.Vehicles
                .AsNoTracking()
                .Where(v => v.UserId.HasValue && customerIds.Contains(v.UserId.Value))
                .GroupBy(v => v.UserId!.Value)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    Count = g.Count()
                })
                .ToDictionaryAsync(x => x.CustomerId, x => x.Count);
        }

        private static CustomerReportDto BuildCustomerReport(
            IEnumerable<CustomerInvoiceReportRow> rows,
            IReadOnlyDictionary<int, int> vehicleCounts)
        {
            var rowList = rows.ToList();
            var first = rowList[0];
            var invoiceCount = rowList.Count;
            var totalSpend = rowList.Sum(r => r.FinalTotal);
            var totalPaidAmount = rowList.Sum(r => r.PaidAmount);
            var totalCreditAmount = rowList.Sum(r => r.CreditAmount);

            return new CustomerReportDto
            {
                CustomerId = first.CustomerId,
                CustomerName = first.CustomerName,
                Email = first.Email,
                PhoneNumber = first.PhoneNumber,
                VehicleCount = vehicleCounts.TryGetValue(first.CustomerId, out var vehicleCount) ? vehicleCount : 0,
                InvoiceCount = invoiceCount,
                TotalSpend = totalSpend,
                TotalPaidAmount = totalPaidAmount,
                TotalCreditAmount = totalCreditAmount,
                AverageInvoiceValue = invoiceCount == 0 ? 0m : decimal.Round(totalSpend / invoiceCount, 2, MidpointRounding.AwayFromZero),
                LastPurchaseDateUtc = rowList.Max(r => r.SaleDate)
            };
        }

        private static PendingCreditCustomerReportDto BuildPendingCreditCustomerReport(
            IEnumerable<CustomerInvoiceReportRow> pendingRows,
            IReadOnlyList<CustomerInvoiceReportRow> allCustomerRows,
            IReadOnlyDictionary<int, int> vehicleCounts,
            DateTime nowUtc)
        {
            var pendingRowList = pendingRows.ToList();
            var first = pendingRowList[0];
            var overdueRows = pendingRowList
                .Where(r => r.CreditDueDate.HasValue && r.CreditDueDate.Value <= nowUtc)
                .ToList();

            return new PendingCreditCustomerReportDto
            {
                CustomerId = first.CustomerId,
                CustomerName = first.CustomerName,
                Email = first.Email,
                PhoneNumber = first.PhoneNumber,
                VehicleCount = vehicleCounts.TryGetValue(first.CustomerId, out var vehicleCount) ? vehicleCount : 0,
                PendingInvoiceCount = pendingRowList.Count,
                TotalSpend = allCustomerRows.Sum(r => r.FinalTotal),
                TotalPaidAmount = allCustomerRows.Sum(r => r.PaidAmount),
                TotalCreditAmount = pendingRowList.Sum(r => r.CreditAmount),
                OverdueInvoiceCount = overdueRows.Count,
                OverdueCreditAmount = overdueRows.Sum(r => r.CreditAmount),
                LastCreditSaleDateUtc = pendingRowList.Max(r => r.SaleDate),
                OldestCreditDueDateUtc = pendingRowList
                    .Where(r => r.CreditDueDate.HasValue)
                    .Select(r => r.CreditDueDate)
                    .Min()
            };
        }

        private static DateTime NormalizeUtcDate(DateTime value)
        {
            return DateTime.SpecifyKind(value.Date, DateTimeKind.Utc);
        }

        private sealed class CustomerInvoiceReportRow
        {
            public int CustomerId { get; set; }
            public string CustomerName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string PhoneNumber { get; set; } = string.Empty;
            public DateTime SaleDate { get; set; }
            public decimal FinalTotal { get; set; }
            public decimal PaidAmount { get; set; }
            public decimal CreditAmount => Math.Max(FinalTotal - PaidAmount, 0m);
            public DateTime? CreditDueDate { get; set; }
        }
    }
}
