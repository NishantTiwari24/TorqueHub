namespace WeatherAPI.DTOs.Notifications
{
    public class NotificationItemDto
    {
        public int NotificationId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ActionUrl { get; set; }
        public bool IsRead { get; set; }
    }
}
