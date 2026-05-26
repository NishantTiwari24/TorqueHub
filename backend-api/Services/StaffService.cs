using Microsoft.AspNetCore.Identity;
using WeatherAPI.DTOs.Staff;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class StaffService : IStaffService
    {
        private readonly UserManager<User> _userManager;
        private readonly IEmailService _emailService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<StaffService> _logger;

        public StaffService(
            UserManager<User> userManager,
            IEmailService emailService,
            INotificationService notificationService,
            ILogger<StaffService> logger)
        {
            _userManager = userManager;
            _emailService = emailService;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<ServiceResult<StaffSummaryDto>> CreateAsync(CreateStaffRequestDto request)
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser is not null)
            {
                return ServiceResult<StaffSummaryDto>.Fail(ServiceErrorType.Conflict, "Email already exists.");
            }

            var user = new User
            {
                Name = request.Name,
                UserName = request.Email,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                EmailConfirmed = true,
                IsActive = true
            };

            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                return ServiceResult<StaffSummaryDto>.Fail(ServiceErrorType.Validation, string.Join(" | ", createResult.Errors.Select(e => e.Description)));
            }

            var roleResult = await _userManager.AddToRoleAsync(user, "Staff");
            if (!roleResult.Succeeded)
            {
                return ServiceResult<StaffSummaryDto>.Fail(ServiceErrorType.Unexpected, string.Join(" | ", roleResult.Errors.Select(e => e.Description)));
            }

            await TrySendStaffCreatedNotificationAsync(user);
            _logger.LogInformation("Staff created: {UserId}", user.Id);
            return ServiceResult<StaffSummaryDto>.Ok(await MapToStaffSummaryAsync(user));
        }

        public async Task<ServiceResult<IReadOnlyList<StaffSummaryDto>>> GetAllAsync()
        {
            var staffUsers = await _userManager.GetUsersInRoleAsync("Staff");
            var ordered = staffUsers.OrderBy(u => u.Name).ToList();
            var data = new List<StaffSummaryDto>(ordered.Count);
            foreach (var user in ordered)
            {
                data.Add(await MapToStaffSummaryAsync(user));
            }
            return ServiceResult<IReadOnlyList<StaffSummaryDto>>.Ok(data);
        }

        public async Task<ServiceResult<StaffSummaryDto>> GetByIdAsync(int staffId)
        {
            var user = await _userManager.FindByIdAsync(staffId.ToString());
            if (user is null || !await _userManager.IsInRoleAsync(user, "Staff"))
            {
                return ServiceResult<StaffSummaryDto>.Fail(ServiceErrorType.NotFound, "Staff user not found.");
            }

            return ServiceResult<StaffSummaryDto>.Ok(await MapToStaffSummaryAsync(user));
        }

        public async Task<ServiceResult<StaffSummaryDto>> UpdateAsync(int staffId, UpdateStaffRequestDto request)
        {
            var user = await _userManager.FindByIdAsync(staffId.ToString());
            if (user is null || !await _userManager.IsInRoleAsync(user, "Staff"))
            {
                return ServiceResult<StaffSummaryDto>.Fail(ServiceErrorType.NotFound, "Staff user not found.");
            }

            var duplicateUser = await _userManager.FindByEmailAsync(request.Email);
            if (duplicateUser is not null && duplicateUser.Id != user.Id)
            {
                return ServiceResult<StaffSummaryDto>.Fail(ServiceErrorType.Conflict, "Email already exists.");
            }

            user.Name = request.Name;
            user.Email = request.Email;
            user.UserName = request.Email;
            user.PhoneNumber = request.PhoneNumber;
            user.IsActive = request.IsActive;

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                return ServiceResult<StaffSummaryDto>.Fail(ServiceErrorType.Validation, string.Join(" | ", updateResult.Errors.Select(e => e.Description)));
            }

            _logger.LogInformation("Staff updated: {UserId}", user.Id);
            return ServiceResult<StaffSummaryDto>.Ok(await MapToStaffSummaryAsync(user));
        }

        public async Task<ServiceResult<bool>> DeleteAsync(int staffId)
        {
            var user = await _userManager.FindByIdAsync(staffId.ToString());
            if (user is null || !await _userManager.IsInRoleAsync(user, "Staff"))
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.NotFound, "Staff user not found.");
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.Unexpected, string.Join(" | ", result.Errors.Select(e => e.Description)));
            }

            _logger.LogInformation("Staff deleted: {UserId}", user.Id);
            return ServiceResult<bool>.Ok(true);
        }

        private async Task<StaffSummaryDto> MapToStaffSummaryAsync(User user)
        {
            var roles = (await _userManager.GetRolesAsync(user)).ToList();
            return new StaffSummaryDto
            {
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                IsActive = user.IsActive,
                Roles = roles
            };
        }

        private async Task TrySendStaffCreatedNotificationAsync(User user)
        {
            try
            {
                await _notificationService.CreateForUserAsync(user.Id, "Your staff account has been created and verified by Admin.");
                if (!string.IsNullOrWhiteSpace(user.Email))
                {
                    await _emailService.SendSystemEmailAsync(
                        user.Id,
                        user.Id,
                        user.Email!,
                        "Your TorqueHub staff account is ready",
                        $"Hello {user.Name},\nYour staff account has been created by admin. You can sign in immediately.",
                        "StaffAccountCreated",
                        $"STF-{user.Id}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send staff-created notification for user {UserId}.", user.Id);
            }
        }
    }
}
