using WeatherAPI.DTOs.Auth;

namespace WeatherAPI.Services.Interfaces
{
    public interface IAuthService
    {
        Task<ServiceResult<AuthResponseDto>> RegisterCustomerAsync(RegisterCustomerRequestDto request);
        Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginRequestDto request);
        Task<ServiceResult<bool>> VerifyEmailAsync(int userId, string token);
        Task<ServiceResult<bool>> ForgotPasswordAsync(ForgotPasswordRequestDto request);
        Task<ServiceResult<bool>> ResetPasswordAsync(ResetPasswordRequestDto request);
        Task<ServiceResult<bool>> ChangePasswordAsync(int userId, ChangePasswordRequestDto request);
        Task<ServiceResult<UserSummaryDto>> GetCurrentUserAsync(int userId);
        Task<ServiceResult<UserSummaryDto>> UpdateCurrentUserAsync(int userId, UpdateMyProfileRequestDto request);
        Task<ServiceResult<bool>> LogoutAsync(int userId);
    }
}
