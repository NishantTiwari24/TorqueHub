using WeatherAPI.DTOs.PartRequests;

namespace WeatherAPI.Services.Interfaces
{
    public interface IPartRequestService
    {
        Task<ServiceResult<PartRequestSummaryDto>> CreateAsync(int userId, string? userEmail, CreateCustomerPartRequestDto request);
        Task<ServiceResult<IReadOnlyList<PartRequestSummaryDto>>> GetForUserAsync(int userId, string? userEmail);
        Task<ServiceResult<PartRequestSummaryDto>> GetForUserByIdAsync(int partRequestId, int userId, string? userEmail);
        Task<ServiceResult<bool>> DeleteForUserAsync(int partRequestId, int userId, string? userEmail);
        Task<ServiceResult<IReadOnlyList<PartRequestSummaryDto>>> GetAllAsync();
        Task<ServiceResult<PartRequestSummaryDto>> UpdateStatusAsync(int partRequestId, UpdatePartRequestStatusDto request);
    }
}
