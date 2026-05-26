using Microsoft.EntityFrameworkCore;
using WeatherAPI.DTOs.Vendor;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class VendorService : IVendorService
    {
        private readonly AppDbContext _dbContext;
        private readonly ILogger<VendorService> _logger;

        public VendorService(AppDbContext dbContext, ILogger<VendorService> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task<ServiceResult<VendorSummaryDto>> CreateAsync(CreateVendorRequestDto request)
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var duplicateEmail = await _dbContext.Vendors.AnyAsync(v => v.Email.ToLower() == normalizedEmail);
            if (duplicateEmail)
            {
                return ServiceResult<VendorSummaryDto>.Fail(ServiceErrorType.Conflict, "Vendor email already exists.");
            }

            var vendor = new Vendor
            {
                Name = request.Name.Trim(),
                Email = request.Email.Trim(),
                PhoneNo = request.PhoneNo.Trim(),
                Address = request.Address.Trim()
            };

            _dbContext.Vendors.Add(vendor);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Vendor created: {VendorId}", vendor.VendorId);
            return ServiceResult<VendorSummaryDto>.Ok(MapToSummary(vendor));
        }

        public async Task<ServiceResult<IReadOnlyList<VendorSummaryDto>>> GetAllAsync()
        {
            var data = await _dbContext.Vendors
                .AsNoTracking()
                .OrderBy(v => v.Name)
                .Select(v => new VendorSummaryDto
                {
                    VendorId = v.VendorId,
                    Name = v.Name,
                    Email = v.Email,
                    PhoneNo = v.PhoneNo,
                    Address = v.Address
                })
                .ToListAsync();

            return ServiceResult<IReadOnlyList<VendorSummaryDto>>.Ok(data);
        }

        public async Task<ServiceResult<VendorSummaryDto>> GetByIdAsync(int vendorId)
        {
            var vendor = await _dbContext.Vendors.AsNoTracking().FirstOrDefaultAsync(v => v.VendorId == vendorId);
            if (vendor is null)
            {
                return ServiceResult<VendorSummaryDto>.Fail(ServiceErrorType.NotFound, "Vendor not found.");
            }

            return ServiceResult<VendorSummaryDto>.Ok(MapToSummary(vendor));
        }

        public async Task<ServiceResult<VendorSummaryDto>> UpdateAsync(int vendorId, UpdateVendorRequestDto request)
        {
            var vendor = await _dbContext.Vendors.FirstOrDefaultAsync(v => v.VendorId == vendorId);
            if (vendor is null)
            {
                return ServiceResult<VendorSummaryDto>.Fail(ServiceErrorType.NotFound, "Vendor not found.");
            }

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var duplicateEmail = await _dbContext.Vendors.AnyAsync(v => v.VendorId != vendorId && v.Email.ToLower() == normalizedEmail);
            if (duplicateEmail)
            {
                return ServiceResult<VendorSummaryDto>.Fail(ServiceErrorType.Conflict, "Vendor email already exists.");
            }

            vendor.Name = request.Name.Trim();
            vendor.Email = request.Email.Trim();
            vendor.PhoneNo = request.PhoneNo.Trim();
            vendor.Address = request.Address.Trim();

            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("Vendor updated: {VendorId}", vendor.VendorId);
            return ServiceResult<VendorSummaryDto>.Ok(MapToSummary(vendor));
        }

        public async Task<ServiceResult<bool>> DeleteAsync(int vendorId)
        {
            var vendor = await _dbContext.Vendors.FirstOrDefaultAsync(v => v.VendorId == vendorId);
            if (vendor is null)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.NotFound, "Vendor not found.");
            }

            var hasLinkedParts = await _dbContext.VehicleParts.AnyAsync(p => p.VendorId == vendorId && !p.IsDeleted);
            if (hasLinkedParts)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.Validation, "Cannot delete vendor with linked vehicle parts.");
            }

            _dbContext.Vendors.Remove(vendor);
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("Vendor deleted: {VendorId}", vendor.VendorId);
            return ServiceResult<bool>.Ok(true);
        }

        private static VendorSummaryDto MapToSummary(Vendor vendor)
        {
            return new VendorSummaryDto
            {
                VendorId = vendor.VendorId,
                Name = vendor.Name,
                Email = vendor.Email,
                PhoneNo = vendor.PhoneNo,
                Address = vendor.Address
            };
        }
    }
}
