namespace WeatherAPI.DTOs.Reminders
{
    public class CreditReminderResultDto
    {
        public int OverdueInvoiceCount { get; set; }
        public int EligibleReminderCount { get; set; }
        public int RemindersSent { get; set; }
        public int RemindersLoggedAsUnsent { get; set; }
        public int RemindersSkippedRecentlySent { get; set; }
        public int RemindersSkippedMissingEmail { get; set; }
        public IReadOnlyList<CreditReminderItemDto> Items { get; set; } = Array.Empty<CreditReminderItemDto>();
    }
}
