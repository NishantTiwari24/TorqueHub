using Microsoft.EntityFrameworkCore;
using WeatherAPI.DTOs.PartRequests;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class PartRequestService : IPartRequestService
    {
        private readonly AppDbContext _dbContext;
        private readonly INotificationService _notificationService;
        private readonly ILogger<PartRequestService> _logger;

        public PartRequestService(AppDbContext dbContext, INotificationService notificationService, ILogger<PartRequestService> logger)
        {
            _dbContext = dbContext;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<ServiceResult<PartRequestSummaryDto>> CreateAsync(int userId, string? userEmail, CreateCustomerPartRequestDto request)
        {
            Vehicle? vehicle = null;
            if (request.VehicleId.HasValue)
            {
                vehicle = await _dbContext.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId.Value);

                if (vehicle is null)
                {
                    return ServiceResult<PartRequestSummaryDto>.Fail(ServiceErrorType.NotFound, "Vehicle not found.");
                }

                if (vehicle.UserId != userId)
                {
                    return ServiceResult<PartRequestSummaryDto>.Fail(ServiceErrorType.Unauthorized, "You can only request parts for your own vehicle.");
                }
            }

            var partRequest = new PartRequest
            {
                UserId = userId,
                VehicleId = vehicle?.VehicleId,
                PartName = request.PartName.Trim(),
                Quantity = request.Quantity,
                Description = request.Description.Trim(),
                Status = "Pending",
                RequestedAtUtc = DateTime.UtcNow
            };

            _dbContext.PartRequests.Add(partRequest);
            await _dbContext.SaveChangesAsync();

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
            await TryNotifyPartRequestSubmittedAsync(partRequest, user?.Name ?? "Customer");
            _logger.LogInformation("Part request created: {PartRequestId}", partRequest.PartRequestId);
            return ServiceResult<PartRequestSummaryDto>.Ok(MapToSummary(partRequest, user, vehicle));
        }

        public async Task<ServiceResult<IReadOnlyList<PartRequestSummaryDto>>> GetForUserAsync(int userId, string? userEmail)
        {
            var data = await BuildSummaryQuery().Where(r => r.UserId == userId).OrderByDescending(r => r.RequestedAtUtc).ToListAsync();
            return ServiceResult<IReadOnlyList<PartRequestSummaryDto>>.Ok(data);
        }

        public async Task<ServiceResult<PartRequestSummaryDto>> GetForUserByIdAsync(int partRequestId, int userId, string? userEmail)
        {
            var data = await BuildSummaryQuery().Where(r => r.PartRequestId == partRequestId && r.UserId == userId).FirstOrDefaultAsync();
            if (data is null)
            {
                return ServiceResult<PartRequestSummaryDto>.Fail(ServiceErrorType.NotFound, "Part request not found.");
            }

            return ServiceResult<PartRequestSummaryDto>.Ok(data);
        }

        public async Task<ServiceResult<bool>> DeleteForUserAsync(int partRequestId, int userId, string? userEmail)
        {
            var partRequest = await _dbContext.PartRequests.FirstOrDefaultAsync(r => r.PartRequestId == partRequestId && r.UserId == userId);
            if (partRequest is null)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.NotFound, "Part request not found.");
            }

            if (!string.Equals(partRequest.Status, "Pending", StringComparison.OrdinalIgnoreCase))
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.Validation, "Only pending part requests can be deleted.");
            }

            _dbContext.PartRequests.Remove(partRequest);
            await _dbContext.SaveChangesAsync();
            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<IReadOnlyList<PartRequestSummaryDto>>> GetAllAsync()
        {
            var data = await BuildSummaryQuery().OrderByDescending(r => r.RequestedAtUtc).ToListAsync();
            return ServiceResult<IReadOnlyList<PartRequestSummaryDto>>.Ok(data);
        }

        public async Task<ServiceResult<PartRequestSummaryDto>> UpdateStatusAsync(int partRequestId, UpdatePartRequestStatusDto request)
        {
            var partRequest = await _dbContext.PartRequests
                .Include(r => r.User)
                .Include(r => r.Vehicle)
                .FirstOrDefaultAsync(r => r.PartRequestId == partRequestId);

            if (partRequest is null)
            {
                return ServiceResult<PartRequestSummaryDto>.Fail(ServiceErrorType.NotFound, "Part request not found.");
            }

            partRequest.Status = request.Status.Trim();
            partRequest.StaffNotes = string.IsNullOrWhiteSpace(request.StaffNotes) ? null : request.StaffNotes.Trim();
            partRequest.UpdatedAtUtc = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return ServiceResult<PartRequestSummaryDto>.Ok(MapToSummary(partRequest, partRequest.User, partRequest.Vehicle));
        }

        private IQueryable<PartRequestSummaryDto> BuildSummaryQuery()
        {
            return _dbContext.PartRequests.AsNoTracking().Include(r => r.User).Include(r => r.Vehicle).Select(r => new PartRequestSummaryDto
            {
                PartRequestId = r.PartRequestId,
                UserId = r.UserId,
                CustomerId = r.UserId,
                CustomerName = r.User.Name,
                VehicleId = r.VehicleId,
                VehicleName = r.Vehicle == null ? null : $"{r.Vehicle.Brand} {r.Vehicle.Model}".Trim(),
                PartName = r.PartName,
                Quantity = r.Quantity,
                Description = r.Description,
                Status = r.Status,
                StaffNotes = r.StaffNotes,
                RequestedAtUtc = r.RequestedAtUtc,
                UpdatedAtUtc = r.UpdatedAtUtc
            });
        }

        private static PartRequestSummaryDto MapToSummary(PartRequest partRequest, User? user, Vehicle? vehicle)
        {
            return new PartRequestSummaryDto
            {
                PartRequestId = partRequest.PartRequestId,
                UserId = partRequest.UserId,
                CustomerId = partRequest.UserId,
                CustomerName = user?.Name ?? "Customer",
                VehicleId = partRequest.VehicleId,
                VehicleName = vehicle is null ? null : $"{vehicle.Brand} {vehicle.Model}".Trim(),
                PartName = partRequest.PartName,
                Quantity = partRequest.Quantity,
                Description = partRequest.Description,
                Status = partRequest.Status,
                StaffNotes = partRequest.StaffNotes,
                RequestedAtUtc = partRequest.RequestedAtUtc,
                UpdatedAtUtc = partRequest.UpdatedAtUtc
            };
        }

        private async Task TryNotifyPartRequestSubmittedAsync(PartRequest partRequest, string customerName)
        {
            try
            {
                var message = $"Part request submitted by {customerName}: {partRequest.PartName} (Qty {partRequest.Quantity}).";
                await _notificationService.CreateForRolesAsync(new[] { "Staff" }, message, "/staff/part-requests");
                await _notificationService.CreateForRolesAsync(new[] { "Admin" }, message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create part-request notification for request {PartRequestId}.", partRequest.PartRequestId);
            }
        }
    }
}
