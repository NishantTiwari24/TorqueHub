using WeatherAPI.DTOs.Vendor;

namespace WeatherAPI.Services.Interfaces
{
    public interface IVendorService
    {
        Task<ServiceResult<VendorSummaryDto>> CreateAsync(CreateVendorRequestDto request);
        Task<ServiceResult<IReadOnlyList<VendorSummaryDto>>> GetAllAsync();
        Task<ServiceResult<VendorSummaryDto>> GetByIdAsync(int vendorId);
        Task<ServiceResult<VendorSummaryDto>> UpdateAsync(int vendorId, UpdateVendorRequestDto request);
        Task<ServiceResult<bool>> DeleteAsync(int vendorId);
    }
}
