using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WeatherAPI.DTOs.Auth;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IEmailService _emailService;
        private readonly INotificationService _notificationService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IJwtTokenService jwtTokenService,
            IEmailService emailService,
            INotificationService notificationService,
            IConfiguration configuration,
            ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenService = jwtTokenService;
            _emailService = emailService;
            _notificationService = notificationService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<ServiceResult<AuthResponseDto>> RegisterCustomerAsync(RegisterCustomerRequestDto request)
        {
            var email = request.Email.Trim();
            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser is not null)
            {
                return ServiceResult<AuthResponseDto>.Fail(ServiceErrorType.Conflict, "A user with this email already exists.");
            }

            var user = new User
            {
                Name = request.Name.Trim(),
                Email = email,
                UserName = email,
                PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
                EmailConfirmed = false,
                IsActive = true
            };

            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                var message = createResult.Errors.FirstOrDefault()?.Description ?? "Unable to create account.";
                return ServiceResult<AuthResponseDto>.Fail(ServiceErrorType.Validation, message);
            }

            var roleResult = await _userManager.AddToRoleAsync(user, "Customer");
            if (!roleResult.Succeeded)
            {
                await _userManager.DeleteAsync(user);
                var message = roleResult.Errors.FirstOrDefault()?.Description ?? "Unable to assign customer role.";
                return ServiceResult<AuthResponseDto>.Fail(ServiceErrorType.Unexpected, message);
            }

            await TrySendCustomerRegistrationNotificationsAsync(user);
            _logger.LogInformation("Customer registered: {UserId}", user.Id);
            return ServiceResult<AuthResponseDto>.Ok(await _jwtTokenService.GenerateTokenAsync(user));
        }

        public async Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginRequestDto request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user is null || !user.IsActive)
            {
                return ServiceResult<AuthResponseDto>.Fail(ServiceErrorType.Unauthorized, "Invalid email or password.");
            }

            var isCustomer = await _userManager.IsInRoleAsync(user, "Customer");
            if (isCustomer && !user.EmailConfirmed)
            {
                return ServiceResult<AuthResponseDto>.Fail(ServiceErrorType.Unauthorized, "Please verify your email before logging in.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded)
            {
                return ServiceResult<AuthResponseDto>.Fail(ServiceErrorType.Unauthorized, "Invalid email or password.");
            }

            _logger.LogInformation("User logged in: {UserId}", user.Id);
            return ServiceResult<AuthResponseDto>.Ok(await _jwtTokenService.GenerateTokenAsync(user));
        }

        public async Task<ServiceResult<bool>> VerifyEmailAsync(int userId, string token)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.NotFound, "User not found.");
            }

            var decodedToken = Uri.UnescapeDataString(token);
            var result = await _userManager.ConfirmEmailAsync(user, decodedToken);
            if (!result.Succeeded)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.Validation, "Invalid or expired verification token.");
            }

            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<bool>> ForgotPasswordAsync(ForgotPasswordRequestDto request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email.Trim());
            if (user is null || !user.IsActive)
            {
                return ServiceResult<bool>.Ok(true);
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var frontendBaseUrl = _configuration["Frontend:BaseUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
            var resetLink = $"{frontendBaseUrl}/reset-password?email={Uri.EscapeDataString(user.Email!)}&token={Uri.EscapeDataString(token)}";

            await _emailService.SendSystemEmailAsync(
                user.Id,
                user.Id,
                user.Email!,
                "Reset your TorqueHub password",
                $"Use this link to reset your password:\n{resetLink}",
                "ForgotPassword",
                $"PWD-{user.Id}");

            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<bool>> ResetPasswordAsync(ResetPasswordRequestDto request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email.Trim());
            if (user is null || !user.IsActive)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.NotFound, "User not found.");
            }

            var decodedToken = Uri.UnescapeDataString(request.Token);
            var result = await _userManager.ResetPasswordAsync(user, decodedToken, request.NewPassword);
            if (!result.Succeeded)
            {
                var message = result.Errors.FirstOrDefault()?.Description ?? "Unable to reset password.";
                return ServiceResult<bool>.Fail(ServiceErrorType.Validation, message);
            }

            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<bool>> ChangePasswordAsync(int userId, ChangePasswordRequestDto request)
        {
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null || !user.IsActive)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.Unauthorized, "Invalid user.");
            }

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
            {
                var message = result.Errors.FirstOrDefault()?.Description ?? "Unable to change password.";
                return ServiceResult<bool>.Fail(ServiceErrorType.Validation, message);
            }

            _logger.LogInformation("User password changed: {UserId}", user.Id);
            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<UserSummaryDto>> GetCurrentUserAsync(int userId)
        {
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null)
            {
                return ServiceResult<UserSummaryDto>.Fail(ServiceErrorType.NotFound, "User not found.");
            }

            return ServiceResult<UserSummaryDto>.Ok(await MapToUserSummaryAsync(user));
        }

        public async Task<ServiceResult<UserSummaryDto>> UpdateCurrentUserAsync(int userId, UpdateMyProfileRequestDto request)
        {
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null)
            {
                return ServiceResult<UserSummaryDto>.Fail(ServiceErrorType.NotFound, "User not found.");
            }

            user.Name = request.Name.Trim();
            user.Email = request.Email.Trim();
            user.UserName = request.Email.Trim();
            user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
            user.ProfileImageUrl = string.IsNullOrWhiteSpace(request.ProfileImageUrl) ? null : request.ProfileImageUrl.Trim();

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var message = result.Errors.FirstOrDefault()?.Description ?? "Unable to update profile.";
                return ServiceResult<UserSummaryDto>.Fail(ServiceErrorType.Validation, message);
            }

            _logger.LogInformation("User profile updated: {UserId}", user.Id);
            return ServiceResult<UserSummaryDto>.Ok(await MapToUserSummaryAsync(user));
        }

        public async Task<ServiceResult<bool>> LogoutAsync(int userId)
        {
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.Unauthorized, "Invalid user.");
            }

            await _userManager.UpdateSecurityStampAsync(user);
            _logger.LogInformation("User logged out: {UserId}", user.Id);
            return ServiceResult<bool>.Ok(true);
        }

        private async Task<UserSummaryDto> MapToUserSummaryAsync(User user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            return new UserSummaryDto
            {
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                ProfileImageUrl = user.ProfileImageUrl,
                CreatedAtUtc = user.CreatedAtUtc,
                Roles = roles
            };
        }

        private async Task TrySendCustomerRegistrationNotificationsAsync(User user)
        {
            try
            {
                await _notificationService.CreateForUserAsync(user.Id, "Welcome to TorqueHub. Your account has been created.");

                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var frontendBaseUrl = _configuration["Frontend:BaseUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
                var verifyLink = $"{frontendBaseUrl}/verify-email?userId={user.Id}&token={Uri.EscapeDataString(token)}";

                await _emailService.SendSystemEmailAsync(
                    user.Id,
                    user.Id,
                    user.Email!,
                    "Verify your TorqueHub email",
                    $"Welcome {user.Name},\nPlease verify your email address using this link:\n{verifyLink}",
                    "EmailVerification",
                    $"USR-{user.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send registration welcome/verification for user {UserId}.", user.Id);
            }
        }
    }
}
