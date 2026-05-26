using WeatherAPI.DTOs.Notifications;

namespace WeatherAPI.Services.Interfaces
{
    public interface INotificationService
    {
        Task<ServiceResult<IReadOnlyList<NotificationItemDto>>> GetUserNotificationsAsync(int userId);
        Task<ServiceResult<bool>> MarkAsReadAsync(int userId, int notificationId);
        Task<ServiceResult<bool>> CreateForUserAsync(int userId, string message, string? actionUrl = null);
        Task<ServiceResult<bool>> CreateForRolesAsync(IEnumerable<string> roles, string message, string? actionUrl = null);
        Task<ServiceResult<IReadOnlyList<LowStockNotificationDto>>> GetLowStockNotificationsAsync(int adminUserId);
        Task<ServiceResult<LowStockNotificationCheckResultDto>> CheckLowStockAsync();
    }
}
