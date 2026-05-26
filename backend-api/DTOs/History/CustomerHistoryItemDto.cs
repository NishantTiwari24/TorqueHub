namespace WeatherAPI.DTOs.History
{
    public class CustomerHistoryItemDto
    {
        public int HistoryId { get; set; }
        public string HistoryType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ReferenceNumber { get; set; }
        public DateTime EventDateUtc { get; set; }
        public decimal? Amount { get; set; }
        public string? PaymentStatus { get; set; }
        public DateTime? CreditDueDateUtc { get; set; }
        public int? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Discount { get; set; }
        public decimal? FinalTotal { get; set; }
    }
}
