using WeatherAPI.DTOs.Reminders;

namespace WeatherAPI.Services.Interfaces
{
    public interface ICreditReminderService
    {
        Task<ServiceResult<CreditReminderResultDto>> SendOverdueCreditRemindersAsync(int sentByUserId);
    }
}
