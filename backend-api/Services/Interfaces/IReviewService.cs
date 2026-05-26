using WeatherAPI.DTOs.Reviews;

namespace WeatherAPI.Services.Interfaces
{
    public interface IReviewService
    {
        Task<ServiceResult<ReviewSummaryDto>> CreateAsync(int userId, string? userEmail, CreateReviewRequestDto request);
        Task<ServiceResult<IReadOnlyList<ReviewSummaryDto>>> GetForUserAsync(int userId, string? userEmail);
        Task<ServiceResult<IReadOnlyList<ReviewSummaryDto>>> GetAllAsync();
        Task<ServiceResult<ReviewSummaryDto>> UpdateAsync(int reviewId, int userId, string? userEmail, UpdateReviewRequestDto request);
        Task<ServiceResult<bool>> DeleteAsync(int reviewId, int userId, string? userEmail);
    }
}
