namespace WeatherAPI.DTOs.Reports
{
    public class PendingCreditCustomerReportDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public int VehicleCount { get; set; }
        public int PendingInvoiceCount { get; set; }
        public decimal TotalSpend { get; set; }
        public decimal TotalPaidAmount { get; set; }
        public decimal TotalCreditAmount { get; set; }
        public int OverdueInvoiceCount { get; set; }
        public decimal OverdueCreditAmount { get; set; }
        public DateTime? LastCreditSaleDateUtc { get; set; }
        public DateTime? OldestCreditDueDateUtc { get; set; }
    }
}
