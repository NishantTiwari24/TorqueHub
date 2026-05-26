using System.Net;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WeatherAPI.DTOs.Email;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class EmailService : IEmailService
    {
        private const string InvoiceEmailType = "Invoice";
        private const string CreditReminderEmailType = "CreditReminder";

        private readonly AppDbContext _dbContext;
        private readonly SmtpSettings _smtpSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(
            AppDbContext dbContext,
            IOptions<SmtpSettings> smtpSettings,
            ILogger<EmailService> logger)
        {
            _dbContext = dbContext;
            _smtpSettings = smtpSettings.Value;
            _logger = logger;
        }

        public async Task<EmailLogSummaryDto> SendInvoiceAsync(int sentByUserId, SendInvoiceEmailRequestDto request)
        {
            return await SendTrackedEmailAsync(sentByUserId, request, InvoiceEmailType);
        }

        public async Task<EmailLogSummaryDto> SendCreditReminderAsync(int sentByUserId, SendInvoiceEmailRequestDto request)
        {
            return await SendTrackedEmailAsync(sentByUserId, request, CreditReminderEmailType);
        }

        public async Task<EmailLogSummaryDto> SendSystemEmailAsync(
            int? userId,
            int sentByUserId,
            string recipientEmail,
            string subject,
            string body,
            string emailType,
            string? referenceNumber = null)
        {
            var request = new SendInvoiceEmailRequestDto
            {
                CustomerId = userId,
                RecipientEmail = recipientEmail,
                InvoiceNumber = string.IsNullOrWhiteSpace(referenceNumber) ? "N/A" : referenceNumber,
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };

            var summary = await SendTrackedEmailAsync(sentByUserId, request, emailType);
            if (!string.IsNullOrWhiteSpace(referenceNumber) && summary.ReferenceNumber != referenceNumber)
            {
                summary.ReferenceNumber = referenceNumber;
            }

            return summary;
        }

        private async Task<EmailLogSummaryDto> SendTrackedEmailAsync(int sentByUserId, SendInvoiceEmailRequestDto request, string emailType)
        {
            var sentByUser = await _dbContext.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == sentByUserId);

            User? customerUser = null;
            if (request.CustomerId.HasValue)
            {
                customerUser = await _dbContext.Users
                    .FirstOrDefaultAsync(u => u.Id == request.CustomerId.Value);

                if (customerUser is null)
                {
                    throw new InvalidOperationException("Customer not found.");
                }
            }

            var emailLog = new EmailLog
            {
                UserId = customerUser?.Id,
                SentByUserId = sentByUserId,
                RecipientEmail = request.RecipientEmail.Trim(),
                Subject = request.Subject.Trim(),
                Body = request.Body.Trim(),
                ReferenceNumber = request.InvoiceNumber.Trim(),
                EmailType = emailType,
                CreatedAtUtc = DateTime.UtcNow
            };

            if (!HasValidSmtpSettings())
            {
                emailLog.IsSent = false;
                emailLog.ErrorMessage = "SMTP configuration is incomplete. Configure SmtpSettings Host, FromEmail, UserName, and Password.";
                _dbContext.EmailLogs.Add(emailLog);
                await _dbContext.SaveChangesAsync();
                return MapToSummary(emailLog, customerUser, sentByUser);
            }

            try
            {
                await SendEmailAsync(emailLog, request);
                emailLog.IsSent = true;
                emailLog.SentAtUtc = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "{EmailType} email failed for recipient {RecipientEmail}.", emailType, emailLog.RecipientEmail);
                emailLog.IsSent = false;
                emailLog.ErrorMessage = TrimErrorMessage(ex.Message);
            }

            _dbContext.EmailLogs.Add(emailLog);
            await _dbContext.SaveChangesAsync();
            return MapToSummary(emailLog, customerUser, sentByUser);
        }

        public async Task<IReadOnlyList<EmailLogSummaryDto>> GetLogsAsync()
        {
            return await BuildSummaryQuery()
                .OrderByDescending(e => e.CreatedAtUtc)
                .ToListAsync();
        }

        public async Task<EmailLogSummaryDto?> GetLogByIdAsync(int emailLogId)
        {
            return await BuildSummaryQuery()
                .FirstOrDefaultAsync(e => e.EmailLogId == emailLogId);
        }

        private async Task SendEmailAsync(EmailLog emailLog, SendInvoiceEmailRequestDto request)
        {
            using var message = new MailMessage
            {
                From = new MailAddress(
                    _smtpSettings.FromEmail.Trim(),
                    string.IsNullOrWhiteSpace(_smtpSettings.FromName) ? _smtpSettings.FromEmail.Trim() : _smtpSettings.FromName.Trim()),
                Subject = emailLog.Subject,
                Body = emailLog.Body,
                IsBodyHtml = request.IsBodyHtml
            };
            message.To.Add(emailLog.RecipientEmail);

            if (!string.IsNullOrWhiteSpace(request.AttachmentBase64))
            {
                var fileName = string.IsNullOrWhiteSpace(request.AttachmentFileName)
                    ? "invoice.pdf"
                    : request.AttachmentFileName.Trim();
                var bytes = Convert.FromBase64String(request.AttachmentBase64);
                var stream = new MemoryStream(bytes);
                var attachment = new Attachment(stream, fileName, "application/pdf");
                message.Attachments.Add(attachment);
            }

            using var smtpClient = new SmtpClient(_smtpSettings.Host.Trim(), _smtpSettings.Port)
            {
                EnableSsl = _smtpSettings.EnableSsl,
                Credentials = new NetworkCredential(_smtpSettings.UserName.Trim(), _smtpSettings.Password)
            };

            await smtpClient.SendMailAsync(message);
        }

        private IQueryable<EmailLogSummaryDto> BuildSummaryQuery()
        {
            return _dbContext.EmailLogs
                .AsNoTracking()
                .Include(e => e.User)
                .Include(e => e.SentByUser)
                .Select(e => new EmailLogSummaryDto
                {
                    EmailLogId = e.EmailLogId,
                    CustomerId = e.UserId,
                    CustomerName = e.User == null ? null : e.User.Name,
                    SentByUserId = e.SentByUserId,
                    SentByName = e.SentByUser == null ? null : e.SentByUser.Name,
                    RecipientEmail = e.RecipientEmail,
                    Subject = e.Subject,
                    ReferenceNumber = e.ReferenceNumber,
                    EmailType = e.EmailType,
                    IsSent = e.IsSent,
                    ErrorMessage = e.ErrorMessage,
                    CreatedAtUtc = e.CreatedAtUtc,
                    SentAtUtc = e.SentAtUtc
                });
        }

        private bool HasValidSmtpSettings()
        {
            return !string.IsNullOrWhiteSpace(_smtpSettings.Host) &&
                _smtpSettings.Port > 0 &&
                !string.IsNullOrWhiteSpace(_smtpSettings.FromEmail) &&
                !string.IsNullOrWhiteSpace(_smtpSettings.UserName) &&
                !string.IsNullOrWhiteSpace(_smtpSettings.Password);
        }

        private static EmailLogSummaryDto MapToSummary(EmailLog emailLog, User? customerUser, User? sentByUser)
        {
            return new EmailLogSummaryDto
            {
                EmailLogId = emailLog.EmailLogId,
                CustomerId = emailLog.UserId,
                CustomerName = customerUser?.Name,
                SentByUserId = emailLog.SentByUserId,
                SentByName = sentByUser?.Name,
                RecipientEmail = emailLog.RecipientEmail,
                Subject = emailLog.Subject,
                ReferenceNumber = emailLog.ReferenceNumber,
                EmailType = emailLog.EmailType,
                IsSent = emailLog.IsSent,
                ErrorMessage = emailLog.ErrorMessage,
                CreatedAtUtc = emailLog.CreatedAtUtc,
                SentAtUtc = emailLog.SentAtUtc
            };
        }

        private static string TrimErrorMessage(string message)
        {
            return string.IsNullOrWhiteSpace(message)
                ? "Email could not be sent."
                : message.Length <= 1000 ? message : message[..1000];
        }
    }
}
