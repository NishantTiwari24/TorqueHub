using WeatherAPI.DTOs.Staff;

namespace WeatherAPI.Services.Interfaces
{
    public interface IStaffService
    {
        Task<ServiceResult<StaffSummaryDto>> CreateAsync(CreateStaffRequestDto request);
        Task<ServiceResult<IReadOnlyList<StaffSummaryDto>>> GetAllAsync();
        Task<ServiceResult<StaffSummaryDto>> GetByIdAsync(int staffId);
        Task<ServiceResult<StaffSummaryDto>> UpdateAsync(int staffId, UpdateStaffRequestDto request);
        Task<ServiceResult<bool>> DeleteAsync(int staffId);
    }
}
