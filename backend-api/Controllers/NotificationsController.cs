using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.Notifications;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet("me")]
        public async Task<ActionResult<IReadOnlyList<NotificationItemDto>>> GetMyNotifications()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            return this.ToActionResult(await _notificationService.GetUserNotificationsAsync(userId.Value));
        }

        [HttpPatch("{notificationId:int}/read")]
        public async Task<IActionResult> MarkAsRead(int notificationId)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            return this.ToActionResult(await _notificationService.MarkAsReadAsync(userId.Value, notificationId));
        }

        [HttpGet("low-stock")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IReadOnlyList<LowStockNotificationDto>>> GetLowStockNotifications()
        {
            var adminUserId = GetCurrentUserId();
            if (!adminUserId.HasValue)
            {
                return Unauthorized(new { success = false, message = "Invalid admin token." });
            }

            var result = await _notificationService.GetLowStockNotificationsAsync(adminUserId.Value);
            return this.ToActionResult(result);
        }

        [HttpPost("check-low-stock")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<LowStockNotificationCheckResultDto>> CheckLowStock()
        {
            var result = await _notificationService.CheckLowStockAsync();
            return this.ToActionResult(result);
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }
}
