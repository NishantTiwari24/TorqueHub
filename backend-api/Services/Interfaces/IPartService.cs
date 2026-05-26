using WeatherAPI.DTOs.Part;

namespace WeatherAPI.Services.Interfaces
{
    public interface IPartService
    {
        Task<ServiceResult<PartSummaryDto>> CreateAsync(CreatePartRequestDto request);
        Task<ServiceResult<IReadOnlyList<PartSummaryDto>>> GetAllAsync();
        Task<ServiceResult<PartSummaryDto>> GetByIdAsync(int partId);
        Task<ServiceResult<PartSummaryDto>> UpdateAsync(int partId, UpdatePartRequestDto request);
        Task<ServiceResult<PartSummaryDto>> PurchaseAsync(int partId, PurchasePartStockRequestDto request);
        Task<ServiceResult<bool>> DeleteAsync(int partId);
    }
}
