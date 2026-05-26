using WeatherAPI.DTOs.Auth;
using WeatherAPI.Models;

namespace WeatherAPI.Services.Interfaces
{
    public interface IJwtTokenService
    {
        Task<AuthResponseDto> GenerateTokenAsync(User user);
    }
}
