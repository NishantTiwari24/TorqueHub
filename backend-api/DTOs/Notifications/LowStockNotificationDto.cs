namespace WeatherAPI.DTOs.Notifications
{
    public class LowStockNotificationDto
    {
        public int? NotificationId { get; set; }
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int StockQuantity { get; set; }
        public int Threshold { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ActionUrl { get; set; }
        public bool IsRead { get; set; }
    }
}
