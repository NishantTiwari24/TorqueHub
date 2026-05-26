using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.Auth;
using WeatherAPI.Services;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("register-customer")]
        public async Task<ActionResult<AuthResponseDto>> RegisterCustomer([FromBody] RegisterCustomerRequestDto request)
        {
            var response = await _authService.RegisterCustomerAsync(request);
            return this.ToActionResult(response);
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            var response = await _authService.LoginAsync(request);
            return this.ToActionResult(response);
        }

        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] int userId, [FromQuery] string token)
        {
            var response = await _authService.VerifyEmailAsync(userId, token);
            return this.ToActionResult(response);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            var response = await _authService.ForgotPasswordAsync(request);
            return this.ToActionResult(response);
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            var response = await _authService.ResetPasswordAsync(request);
            return this.ToActionResult(response);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<UserSummaryDto>> Me()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            return this.ToActionResult(await _authService.GetCurrentUserAsync(userId));
        }

        [Authorize]
        [HttpPut("me")]
        public async Task<ActionResult<UserSummaryDto>> UpdateMe([FromBody] UpdateMyProfileRequestDto request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            return this.ToActionResult(await _authService.UpdateCurrentUserAsync(userId, request));
        }

        [Authorize]
        [HttpPost("me/change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            return this.ToActionResult(await _authService.ChangePasswordAsync(userId, request));
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            var result = await _authService.LogoutAsync(userId);
            if (!result.Success)
            {
                _logger.LogWarning("Logout failed: {Message}", result.Error?.Message);
                return this.ToActionResult(result);
            }

            return Ok(new { success = true, message = "Logged out successfully." });
        }
    }
}
