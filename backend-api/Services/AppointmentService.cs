using Microsoft.EntityFrameworkCore;
using System.Data;
using WeatherAPI.DTOs.Appointments;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class AppointmentService : IAppointmentService
    {
        private readonly AppDbContext _dbContext;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;
        private readonly ILogger<AppointmentService> _logger;

        public AppointmentService(
            AppDbContext dbContext,
            INotificationService notificationService,
            IEmailService emailService,
            ILogger<AppointmentService> logger)
        {
            _dbContext = dbContext;
            _notificationService = notificationService;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<ServiceResult<AppointmentSummaryDto>> CreateAsync(int userId, string? userEmail, CreateAppointmentRequestDto request)
        {
            var appointmentDate = NormalizeToUtc(request.Date);
            if (appointmentDate <= DateTime.UtcNow)
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.Validation, "Appointment date must be in the future.");
            }
            if (string.IsNullOrWhiteSpace(request.ServiceType))
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.Validation, "Service type is required.");
            }

            var vehicle = await _dbContext.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId);
            if (vehicle is null)
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.NotFound, "Vehicle not found.");
            }

            if (!BelongsToUser(vehicle, userId, userEmail))
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.Unauthorized, "You can only book appointments for your own vehicle.");
            }

            var appointment = new Appointment
            {
                UserId = userId,
                VehicleId = vehicle.VehicleId,
                Date = appointmentDate,
                ServiceType = request.ServiceType.Trim(),
                Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
                Status = AppointmentStatus.Pending
            };

            _dbContext.Appointments.Add(appointment);
            await _dbContext.SaveChangesAsync();
            await TrySendAppointmentBookingConfirmationAsync(appointment, vehicle);
            await TryNotifyStaffAppointmentBookedAsync(appointment, vehicle);
            _logger.LogInformation("Appointment created: {AppointmentId}", appointment.AppointmentId);
            return ServiceResult<AppointmentSummaryDto>.Ok(MapToSummary(appointment, vehicle));
        }

        public async Task<ServiceResult<IReadOnlyList<AppointmentSummaryDto>>> GetForUserAsync(int userId, string? userEmail)
        {
            var data = await _dbContext.Appointments
                .AsNoTracking()
                .Include(a => a.User)
                .Include(a => a.Vehicle)
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Date)
                .Select(a => new AppointmentSummaryDto
                {
                    AppointmentId = a.AppointmentId,
                    UserId = a.UserId,
                    CustomerName = a.User.Name,
                    CustomerEmail = a.User.Email ?? string.Empty,
                    VehicleId = a.VehicleId,
                    VehicleName = $"{a.Vehicle.Brand} {a.Vehicle.Model}".Trim(),
                    VehicleNumber = a.Vehicle.VehicleNumber,
                    Date = a.Date,
                    ServiceType = a.ServiceType,
                    Notes = a.Notes,
                    Status = a.Status.ToString()
                })
                .ToListAsync();

            return ServiceResult<IReadOnlyList<AppointmentSummaryDto>>.Ok(data);
        }

        public async Task<ServiceResult<IReadOnlyList<AppointmentSummaryDto>>> GetAllAsync()
        {
            var data = await _dbContext.Appointments
                .AsNoTracking()
                .Include(a => a.User)
                .Include(a => a.Vehicle)
                .OrderByDescending(a => a.Date)
                .Select(a => new AppointmentSummaryDto
                {
                    AppointmentId = a.AppointmentId,
                    UserId = a.UserId,
                    CustomerName = a.User.Name,
                    CustomerEmail = a.User.Email ?? string.Empty,
                    VehicleId = a.VehicleId,
                    VehicleName = $"{a.Vehicle.Brand} {a.Vehicle.Model}".Trim(),
                    VehicleNumber = a.Vehicle.VehicleNumber,
                    Date = a.Date,
                    ServiceType = a.ServiceType,
                    Notes = a.Notes,
                    Status = a.Status.ToString()
                })
                .ToListAsync();

            return ServiceResult<IReadOnlyList<AppointmentSummaryDto>>.Ok(data);
        }

        public async Task<ServiceResult<AppointmentSummaryDto>> RescheduleAsync(int appointmentId, int userId, string? userEmail, RescheduleAppointmentRequestDto request)
        {
            var appointment = await GetAppointmentWithVehicleAsync(appointmentId);
            if (appointment is null)
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.NotFound, "Appointment not found.");
            }

            if (!BelongsToUser(appointment.Vehicle, userId, userEmail))
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.Unauthorized, "You can only reschedule your own appointment.");
            }

            if (appointment.Status is AppointmentStatus.Completed or AppointmentStatus.Cancelled)
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.Validation, "Completed or cancelled appointments cannot be rescheduled.");
            }

            var appointmentDate = NormalizeToUtc(request.Date);
            if (appointmentDate <= DateTime.UtcNow)
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.Validation, "Appointment date must be in the future.");
            }

            appointment.Date = appointmentDate;
            appointment.Status = AppointmentStatus.Pending;
            await _dbContext.SaveChangesAsync();
            return ServiceResult<AppointmentSummaryDto>.Ok(MapToSummary(appointment, appointment.Vehicle));
        }

        public async Task<ServiceResult<AppointmentSummaryDto>> CancelAsync(int appointmentId, int userId, string? userEmail)
        {
            var appointment = await GetAppointmentWithVehicleAsync(appointmentId);
            if (appointment is null)
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.NotFound, "Appointment not found.");
            }

            if (!BelongsToUser(appointment.Vehicle, userId, userEmail))
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.Unauthorized, "You can only cancel your own appointment.");
            }

            if (appointment.Status == AppointmentStatus.Completed)
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.Validation, "Completed appointments cannot be cancelled.");
            }

            appointment.Status = AppointmentStatus.Cancelled;
            await _dbContext.SaveChangesAsync();
            return ServiceResult<AppointmentSummaryDto>.Ok(MapToSummary(appointment, appointment.Vehicle));
        }

        public async Task<ServiceResult<AppointmentSummaryDto>> UpdateStatusAsync(int appointmentId, UpdateAppointmentStatusRequestDto request)
        {
            var appointment = await GetAppointmentWithVehicleAsync(appointmentId);
            if (appointment is null)
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.NotFound, "Appointment not found.");
            }

            if (!Enum.TryParse<AppointmentStatus>(request.Status, true, out var status))
            {
                return ServiceResult<AppointmentSummaryDto>.Fail(ServiceErrorType.Validation, "Invalid appointment status.");
            }

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted);
            var previousStatus = appointment.Status;
            appointment.Status = status;
            if (status == AppointmentStatus.Completed && previousStatus != AppointmentStatus.Completed)
            {
                await EnsureServiceHistoryForCompletedAppointmentAsync(appointment);
                await TryNotifyServiceCompletedAsync(appointment);
            }

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            return ServiceResult<AppointmentSummaryDto>.Ok(MapToSummary(appointment, appointment.Vehicle));
        }

        private async Task EnsureServiceHistoryForCompletedAppointmentAsync(Appointment appointment)
        {
            var exists = await _dbContext.ServiceHistories.AnyAsync(h => h.AppointmentId == appointment.AppointmentId);
            if (exists)
            {
                return;
            }

            var reference = $"APT-{appointment.AppointmentId:D6}";
            var description = $"Service completed: {appointment.ServiceType}. {appointment.Notes}".Trim();
            if (description.Length > 200)
            {
                description = description[..200];
            }

            _dbContext.ServiceHistories.Add(new ServiceHistory
            {
                UserId = appointment.UserId,
                AppointmentId = appointment.AppointmentId,
                HistoryType = "Service",
                Description = description,
                ReferenceNumber = reference,
                EventDateUtc = DateTime.UtcNow,
                Amount = null
            });
        }

        private async Task<Appointment?> GetAppointmentWithVehicleAsync(int appointmentId)
        {
            return await _dbContext.Appointments
                .Include(a => a.User)
                .Include(a => a.Vehicle)
                .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId);
        }

        private static bool BelongsToUser(Vehicle vehicle, int userId, string? userEmail) => vehicle.UserId == userId;

        private static AppointmentSummaryDto MapToSummary(Appointment appointment, Vehicle vehicle)
        {
            return new AppointmentSummaryDto
            {
                AppointmentId = appointment.AppointmentId,
                UserId = appointment.UserId,
                CustomerName = appointment.User?.Name ?? string.Empty,
                CustomerEmail = appointment.User?.Email ?? string.Empty,
                VehicleId = appointment.VehicleId,
                VehicleName = $"{vehicle.Brand} {vehicle.Model}".Trim(),
                VehicleNumber = vehicle.VehicleNumber,
                Date = appointment.Date,
                ServiceType = appointment.ServiceType,
                Notes = appointment.Notes,
                Status = appointment.Status.ToString()
            };
        }

        private static DateTime NormalizeToUtc(DateTime value)
        {
            return value.Kind switch
            {
                DateTimeKind.Utc => value,
                DateTimeKind.Local => value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
            };
        }

        private async Task TrySendAppointmentBookingConfirmationAsync(Appointment appointment, Vehicle vehicle)
        {
            try
            {
                var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == appointment.UserId);
                if (string.IsNullOrWhiteSpace(user?.Email))
                {
                    return;
                }

                await _notificationService.CreateForUserAsync(appointment.UserId,
                    $"Appointment booked for {vehicle.Brand} {vehicle.Model} on {appointment.Date:yyyy-MM-dd HH:mm} UTC.",
                    "/customer/my-appointments");

                await _emailService.SendSystemEmailAsync(
                    appointment.UserId,
                    appointment.UserId,
                    user.Email!,
                    "Appointment Booking Confirmation - TorqueHub",
                    $"Your appointment for {vehicle.Brand} {vehicle.Model} is confirmed on {appointment.Date:yyyy-MM-dd HH:mm} UTC.",
                    "AppointmentConfirmation",
                    $"APT-{appointment.AppointmentId:D6}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send appointment booking confirmation for appointment {AppointmentId}.", appointment.AppointmentId);
            }
        }

        private async Task TryNotifyServiceCompletedAsync(Appointment appointment)
        {
            try
            {
                await _notificationService.CreateForUserAsync(
                    appointment.UserId,
                    $"Your service for appointment #{appointment.AppointmentId} ({appointment.ServiceType}) has been completed successfully.",
                    "/customer/my-appointments");

                var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == appointment.UserId);
                if (!string.IsNullOrWhiteSpace(user?.Email))
                {
                    await _emailService.SendSystemEmailAsync(
                        appointment.UserId,
                        appointment.UserId,
                        user.Email!,
                        "Service Completed - TorqueHub",
                        $"Your service for appointment #{appointment.AppointmentId} has been completed successfully.",
                        "ServiceCompleted",
                        $"APT-{appointment.AppointmentId:D6}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send service completed notification for appointment {AppointmentId}.", appointment.AppointmentId);
            }
        }

        private async Task TryNotifyStaffAppointmentBookedAsync(Appointment appointment, Vehicle vehicle)
        {
            try
            {
                var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == appointment.UserId);
                var customerName = string.IsNullOrWhiteSpace(user?.Name) ? "Customer" : user!.Name;
                var message = $"New pending appointment booked by {customerName}: {vehicle.Brand} {vehicle.Model} on {appointment.Date:yyyy-MM-dd HH:mm} UTC.";
                await _notificationService.CreateForRolesAsync(new[] { "Staff" }, message, "/staff/appointments");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create staff appointment notification for appointment {AppointmentId}.", appointment.AppointmentId);
            }
        }
    }
}
