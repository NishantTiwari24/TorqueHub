namespace WeatherAPI.DTOs.Reminders
{
    public class CreditReminderItemDto
    {
        public int SalesInvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string RecipientEmail { get; set; } = string.Empty;
        public DateTime SaleDateUtc { get; set; }
        public DateTime? CreditDueDateUtc { get; set; }
        public decimal FinalTotal { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal CreditAmount { get; set; }
        public DateTime? LastCreditReminderSentAtUtc { get; set; }
        public bool ReminderAttempted { get; set; }
        public bool IsSent { get; set; }
        public int? EmailLogId { get; set; }
        public string? ErrorMessage { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
