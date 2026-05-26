namespace WeatherAPI.DTOs.Notifications
{
    public class LowStockNotificationCheckResultDto
    {
        public int LowStockPartCount { get; set; }
        public int AdminCount { get; set; }
        public int NotificationsCreated { get; set; }
        public int NotificationsUpdated { get; set; }
        public int NotificationsSkipped { get; set; }
        public IReadOnlyList<LowStockNotificationDto> LowStockItems { get; set; } = Array.Empty<LowStockNotificationDto>();
    }
}
