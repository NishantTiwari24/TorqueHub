using WeatherAPI.DTOs.Appointments;

namespace WeatherAPI.Services.Interfaces
{
    public interface IAppointmentService
    {
        Task<ServiceResult<AppointmentSummaryDto>> CreateAsync(int userId, string? userEmail, CreateAppointmentRequestDto request);
        Task<ServiceResult<IReadOnlyList<AppointmentSummaryDto>>> GetForUserAsync(int userId, string? userEmail);
        Task<ServiceResult<IReadOnlyList<AppointmentSummaryDto>>> GetAllAsync();
        Task<ServiceResult<AppointmentSummaryDto>> RescheduleAsync(int appointmentId, int userId, string? userEmail, RescheduleAppointmentRequestDto request);
        Task<ServiceResult<AppointmentSummaryDto>> CancelAsync(int appointmentId, int userId, string? userEmail);
        Task<ServiceResult<AppointmentSummaryDto>> UpdateStatusAsync(int appointmentId, UpdateAppointmentStatusRequestDto request);
    }
}
