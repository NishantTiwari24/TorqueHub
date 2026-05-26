namespace WeatherAPI.DTOs.Email
{
    public class EmailLogSummaryDto
    {
        public int EmailLogId { get; set; }
        public int? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public int? SentByUserId { get; set; }
        public string? SentByName { get; set; }
        public string RecipientEmail { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string? ReferenceNumber { get; set; }
        public string EmailType { get; set; } = string.Empty;
        public bool IsSent { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime? SentAtUtc { get; set; }
    }
}
