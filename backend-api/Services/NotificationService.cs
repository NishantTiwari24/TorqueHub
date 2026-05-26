using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WeatherAPI.DTOs.Notifications;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class NotificationService : INotificationService
    {
        private const int LowStockThreshold = 10;
        private const string LowStockMessagePrefix = "Low stock alert";
        private const string LowStockActionUrl = "/admin/manage-part";

        private readonly AppDbContext _dbContext;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            AppDbContext dbContext,
            UserManager<User> userManager,
            ILogger<NotificationService> logger)
        {
            _dbContext = dbContext;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<ServiceResult<IReadOnlyList<NotificationItemDto>>> GetUserNotificationsAsync(int userId)
        {
            var exists = await _userManager.Users.AnyAsync(u => u.Id == userId && u.IsActive);
            if (!exists)
            {
                return ServiceResult<IReadOnlyList<NotificationItemDto>>.Fail(ServiceErrorType.NotFound, "User not found.");
            }

            var items = await _dbContext.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.NotificationId)
                .Select(n => new NotificationItemDto
                {
                    NotificationId = n.NotificationId,
                    Message = n.Message,
                    ActionUrl = n.ActionUrl,
                    IsRead = n.IsRead
                })
                .ToListAsync();

            return ServiceResult<IReadOnlyList<NotificationItemDto>>.Ok(items);
        }

        public async Task<ServiceResult<bool>> MarkAsReadAsync(int userId, int notificationId)
        {
            var notification = await _dbContext.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.UserId == userId);
            if (notification is null)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.NotFound, "Notification not found.");
            }

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                await _dbContext.SaveChangesAsync();
            }

            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<bool>> CreateForUserAsync(int userId, string message, string? actionUrl = null)
        {
            var exists = await _userManager.Users.AnyAsync(u => u.Id == userId && u.IsActive);
            if (!exists)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.NotFound, "User not found.");
            }

            _dbContext.Notifications.Add(new Notification
            {
                UserId = userId,
                Message = message.Trim(),
                ActionUrl = NormalizeActionUrl(actionUrl),
                IsRead = false
            });
            await _dbContext.SaveChangesAsync();
            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<bool>> CreateForRolesAsync(IEnumerable<string> roles, string message, string? actionUrl = null)
        {
            var roleList = roles
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => r.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            if (roleList.Count == 0)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.Validation, "At least one role is required.");
            }

            var recipients = new Dictionary<int, User>();
            foreach (var role in roleList)
            {
                var users = await _userManager.GetUsersInRoleAsync(role);
                foreach (var user in users.Where(u => u.IsActive))
                {
                    recipients[user.Id] = user;
                }
            }

            foreach (var user in recipients.Values)
            {
                _dbContext.Notifications.Add(new Notification
                {
                    UserId = user.Id,
                    Message = message.Trim(),
                    ActionUrl = NormalizeActionUrl(actionUrl),
                    IsRead = false
                });
            }

            await _dbContext.SaveChangesAsync();
            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<IReadOnlyList<LowStockNotificationDto>>> GetLowStockNotificationsAsync(int adminUserId)
        {
            var admin = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == adminUserId && u.IsActive);
            if (admin is null || !await _userManager.IsInRoleAsync(admin, "Admin"))
            {
                return ServiceResult<IReadOnlyList<LowStockNotificationDto>>.Fail(ServiceErrorType.Unauthorized, "Admin user not found.");
            }

            var lowStockParts = await GetLowStockPartsAsync();
            var existingNotifications = await GetLowStockNotificationsForUsersAsync(new[] { adminUserId });
            var result = lowStockParts
                .Select(part => MapToDto(part, FindNotificationForPart(existingNotifications, adminUserId, part.PartId)))
                .OrderBy(item => item.StockQuantity)
                .ThenBy(item => item.PartName)
                .ToList();

            return ServiceResult<IReadOnlyList<LowStockNotificationDto>>.Ok(result);
        }

        public async Task<ServiceResult<LowStockNotificationCheckResultDto>> CheckLowStockAsync()
        {
            var lowStockParts = await GetLowStockPartsAsync();
            var admins = (await _userManager.GetUsersInRoleAsync("Admin"))
                .Where(user => user.IsActive)
                .ToList();

            if (admins.Count == 0)
            {
                return ServiceResult<LowStockNotificationCheckResultDto>.Ok(new LowStockNotificationCheckResultDto
                {
                    LowStockPartCount = lowStockParts.Count,
                    AdminCount = 0,
                    LowStockItems = lowStockParts.Select(part => MapToDto(part, null)).ToList()
                });
            }

            var adminIds = admins.Select(admin => admin.Id).ToList();
            var existingNotifications = await GetLowStockNotificationsForUsersAsync(adminIds);
            var created = 0;
            var updated = 0;
            var skipped = 0;

            foreach (var adminId in adminIds)
            {
                foreach (var part in lowStockParts)
                {
                    var message = BuildLowStockMessage(part);
                    var notification = FindNotificationForPart(existingNotifications, adminId, part.PartId);
                    if (notification is null)
                    {
                        notification = new Notification
                        {
                            UserId = adminId,
                            Message = message,
                            ActionUrl = LowStockActionUrl,
                            IsRead = false
                        };
                        _dbContext.Notifications.Add(notification);
                        existingNotifications.Add(notification);
                        created++;
                        continue;
                    }

                    if (notification.Message != message || notification.ActionUrl != LowStockActionUrl || notification.IsRead)
                    {
                        notification.Message = message;
                        notification.ActionUrl = LowStockActionUrl;
                        notification.IsRead = false;
                        updated++;
                    }
                    else
                    {
                        skipped++;
                    }
                }
            }

            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("Low stock check completed. Parts: {PartCount}, Admins: {AdminCount}, Created: {Created}, Updated: {Updated}, Skipped: {Skipped}.",
                lowStockParts.Count,
                admins.Count,
                created,
                updated,
                skipped);

            return ServiceResult<LowStockNotificationCheckResultDto>.Ok(new LowStockNotificationCheckResultDto
            {
                LowStockPartCount = lowStockParts.Count,
                AdminCount = admins.Count,
                NotificationsCreated = created,
                NotificationsUpdated = updated,
                NotificationsSkipped = skipped,
                LowStockItems = lowStockParts.Select(part => MapToDto(part, null)).ToList()
            });
        }

        private async Task<List<LowStockPartRecord>> GetLowStockPartsAsync()
        {
            return await _dbContext.VehicleParts
                .AsNoTracking()
                .Where(part => !part.IsDeleted && part.StockQuantity < LowStockThreshold)
                .OrderBy(part => part.StockQuantity)
                .ThenBy(part => part.Name)
                .Select(part => new LowStockPartRecord
                {
                    PartId = part.PartId,
                    PartName = part.Name,
                    Category = part.Category,
                    StockQuantity = part.StockQuantity
                })
                .ToListAsync();
        }

        private async Task<List<Notification>> GetLowStockNotificationsForUsersAsync(IReadOnlyCollection<int> userIds)
        {
            if (userIds.Count == 0)
            {
                return new List<Notification>();
            }

            return await _dbContext.Notifications
                .Where(notification =>
                    userIds.Contains(notification.UserId) &&
                    notification.Message.StartsWith(LowStockMessagePrefix))
                .ToListAsync();
        }

        private static Notification? FindNotificationForPart(IEnumerable<Notification> notifications, int userId, int partId)
        {
            var partPrefix = BuildLowStockPartPrefix(partId);
            return notifications
                .Where(notification => notification.UserId == userId)
                .OrderByDescending(notification => notification.NotificationId)
                .FirstOrDefault(notification => notification.Message.StartsWith(partPrefix, StringComparison.Ordinal));
        }

        private static LowStockNotificationDto MapToDto(LowStockPartRecord part, Notification? notification)
        {
            return new LowStockNotificationDto
            {
                NotificationId = notification?.NotificationId,
                PartId = part.PartId,
                PartName = part.PartName,
                Category = part.Category,
                StockQuantity = part.StockQuantity,
                Threshold = LowStockThreshold,
                Message = notification?.Message ?? BuildLowStockMessage(part),
                ActionUrl = notification?.ActionUrl ?? LowStockActionUrl,
                IsRead = notification?.IsRead ?? false
            };
        }

        private static string BuildLowStockMessage(LowStockPartRecord part)
        {
            return $"{BuildLowStockPartPrefix(part.PartId)}: {part.PartName} stock is below {LowStockThreshold}. Current quantity: {part.StockQuantity}.";
        }

        private static string BuildLowStockPartPrefix(int partId)
        {
            return $"{LowStockMessagePrefix} [PartId:{partId}]";
        }

        private static string? NormalizeActionUrl(string? actionUrl)
        {
            if (string.IsNullOrWhiteSpace(actionUrl))
            {
                return null;
            }

            var trimmed = actionUrl.Trim();
            return trimmed.Length > 200 ? trimmed[..200] : trimmed;
        }

        private sealed class LowStockPartRecord
        {
            public int PartId { get; set; }
            public string PartName { get; set; } = string.Empty;
            public string Category { get; set; } = string.Empty;
            public int StockQuantity { get; set; }
        }
    }
}
