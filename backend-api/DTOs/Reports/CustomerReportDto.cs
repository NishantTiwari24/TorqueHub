namespace WeatherAPI.DTOs.Reports
{
    public class CustomerReportDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public int VehicleCount { get; set; }
        public int InvoiceCount { get; set; }
        public decimal TotalSpend { get; set; }
        public decimal TotalPaidAmount { get; set; }
        public decimal TotalCreditAmount { get; set; }
        public decimal AverageInvoiceValue { get; set; }
        public DateTime? LastPurchaseDateUtc { get; set; }
    }
}
