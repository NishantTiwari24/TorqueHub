namespace WeatherAPI.DTOs.SalesInvoice
{
    public class SalesInvoiceSummaryDto
    {
        public int SalesInvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int StaffId { get; set; }
        public string StaffName { get; set; } = string.Empty;
        public DateTime SaleDate { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Discount { get; set; }
        public decimal FinalTotal { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal CreditAmount { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public DateTime? CreditDueDate { get; set; }
        public DateTime? LastCreditReminderSentAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public IReadOnlyList<SalesInvoiceItemSummaryDto> Items { get; set; } = Array.Empty<SalesInvoiceItemSummaryDto>();
    }
}
