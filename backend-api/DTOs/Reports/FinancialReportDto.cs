namespace WeatherAPI.DTOs.Reports
{
    public class FinancialReportDto
    {
        public string ReportType { get; set; } = string.Empty;
        public string PeriodLabel { get; set; } = string.Empty;
        public DateTime StartDateUtc { get; set; }
        public DateTime EndDateUtc { get; set; }
        public decimal SalesIncome { get; set; }
        public decimal PurchaseCost { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal TotalProfit { get; set; }
        public decimal PaidSales { get; set; }
        public decimal CreditSales { get; set; }
        public decimal DiscountTotal { get; set; }
        public int SalesInvoiceCount { get; set; }
        public int PurchaseInvoiceCount { get; set; }
        public int TotalInvoiceCount { get; set; }
        public int PaidSalesInvoiceCount { get; set; }
        public int CreditSalesInvoiceCount { get; set; }
        public decimal AverageSalesInvoiceValue { get; set; }
    }
}
