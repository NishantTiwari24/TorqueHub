using WeatherAPI.DTOs.Email;

namespace WeatherAPI.Services.Interfaces
{
    public interface IEmailService
    {
        Task<EmailLogSummaryDto> SendInvoiceAsync(int sentByUserId, SendInvoiceEmailRequestDto request);
        Task<EmailLogSummaryDto> SendCreditReminderAsync(int sentByUserId, SendInvoiceEmailRequestDto request);
        Task<EmailLogSummaryDto> SendSystemEmailAsync(int? userId, int sentByUserId, string recipientEmail, string subject, string body, string emailType, string? referenceNumber = null);
        Task<IReadOnlyList<EmailLogSummaryDto>> GetLogsAsync();
        Task<EmailLogSummaryDto?> GetLogByIdAsync(int emailLogId);
    }
}
