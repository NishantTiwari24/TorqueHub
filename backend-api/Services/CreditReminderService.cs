using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WeatherAPI.DTOs.Email;
using WeatherAPI.DTOs.Reminders;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class CreditReminderService : ICreditReminderService
    {
        private const int ReminderCooldownDays = 7;

        private readonly AppDbContext _dbContext;
        private readonly UserManager<User> _userManager;
        private readonly IEmailService _emailService;
        private readonly ILogger<CreditReminderService> _logger;

        public CreditReminderService(
            AppDbContext dbContext,
            UserManager<User> userManager,
            IEmailService emailService,
            ILogger<CreditReminderService> logger)
        {
            _dbContext = dbContext;
            _userManager = userManager;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<ServiceResult<CreditReminderResultDto>> SendOverdueCreditRemindersAsync(int sentByUserId)
        {
            var sender = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == sentByUserId && u.IsActive);
            if (sender is null || !await _userManager.IsInRoleAsync(sender, "Admin"))
            {
                return ServiceResult<CreditReminderResultDto>.Fail(ServiceErrorType.Unauthorized, "Admin user not found.");
            }

            var nowUtc = DateTime.UtcNow;
            var reminderCooldownUtc = nowUtc.AddDays(-ReminderCooldownDays);
            var overdueInvoices = await _dbContext.SalesInvoices
                .Include(invoice => invoice.Customer)
                .Where(invoice =>
                    invoice.PaymentStatus != "Paid" &&
                    invoice.FinalTotal > invoice.PaidAmount &&
                    invoice.CreditDueDate.HasValue &&
                    invoice.CreditDueDate.Value <= nowUtc)
                .OrderBy(invoice => invoice.CreditDueDate)
                .ThenBy(invoice => invoice.InvoiceNumber)
                .ToListAsync();

            var resultItems = new List<CreditReminderItemDto>();
            var eligibleReminderCount = 0;
            var remindersSent = 0;
            var remindersLoggedAsUnsent = 0;
            var remindersSkippedRecentlySent = 0;
            var remindersSkippedMissingEmail = 0;

            foreach (var invoice in overdueInvoices)
            {
                var item = MapToItem(invoice);
                var recipientEmail = invoice.Customer.Email?.Trim() ?? string.Empty;
                if (string.IsNullOrWhiteSpace(recipientEmail))
                {
                    item.Status = "SkippedMissingEmail";
                    item.ErrorMessage = "Customer email address is missing.";
                    remindersSkippedMissingEmail++;
                    resultItems.Add(item);
                    continue;
                }

                if (invoice.LastCreditReminderSentAtUtc.HasValue &&
                    invoice.LastCreditReminderSentAtUtc.Value >= reminderCooldownUtc)
                {
                    item.Status = "SkippedRecentlySent";
                    remindersSkippedRecentlySent++;
                    resultItems.Add(item);
                    continue;
                }

                eligibleReminderCount++;
                var emailLog = await _emailService.SendCreditReminderAsync(sentByUserId, new SendInvoiceEmailRequestDto
                {
                    CustomerId = invoice.CustomerId,
                    RecipientEmail = recipientEmail,
                    InvoiceNumber = invoice.InvoiceNumber,
                    Subject = $"Payment reminder for invoice {invoice.InvoiceNumber}",
                    Body = BuildReminderBody(invoice),
                    IsBodyHtml = false
                });

                invoice.LastCreditReminderSentAtUtc = nowUtc;

                item.ReminderAttempted = true;
                item.IsSent = emailLog.IsSent;
                item.EmailLogId = emailLog.EmailLogId;
                item.ErrorMessage = emailLog.ErrorMessage;
                item.LastCreditReminderSentAtUtc = invoice.LastCreditReminderSentAtUtc;
                item.Status = emailLog.IsSent ? "Sent" : "LoggedAsUnsent";

                if (emailLog.IsSent)
                {
                    remindersSent++;
                }
                else
                {
                    remindersLoggedAsUnsent++;
                }

                resultItems.Add(item);
            }

            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("Overdue credit reminder run completed. Overdue: {OverdueCount}, Eligible: {EligibleCount}, Sent: {SentCount}, Unsent: {UnsentCount}.",
                overdueInvoices.Count,
                eligibleReminderCount,
                remindersSent,
                remindersLoggedAsUnsent);

            return ServiceResult<CreditReminderResultDto>.Ok(new CreditReminderResultDto
            {
                OverdueInvoiceCount = overdueInvoices.Count,
                EligibleReminderCount = eligibleReminderCount,
                RemindersSent = remindersSent,
                RemindersLoggedAsUnsent = remindersLoggedAsUnsent,
                RemindersSkippedRecentlySent = remindersSkippedRecentlySent,
                RemindersSkippedMissingEmail = remindersSkippedMissingEmail,
                Items = resultItems
            });
        }

        private static CreditReminderItemDto MapToItem(SalesInvoice invoice)
        {
            return new CreditReminderItemDto
            {
                SalesInvoiceId = invoice.SalesInvoiceId,
                InvoiceNumber = invoice.InvoiceNumber,
                CustomerId = invoice.CustomerId,
                CustomerName = invoice.Customer.Name,
                RecipientEmail = invoice.Customer.Email ?? string.Empty,
                SaleDateUtc = invoice.SaleDate,
                CreditDueDateUtc = invoice.CreditDueDate,
                FinalTotal = invoice.FinalTotal,
                PaidAmount = invoice.PaidAmount,
                CreditAmount = invoice.FinalTotal - invoice.PaidAmount,
                LastCreditReminderSentAtUtc = invoice.LastCreditReminderSentAtUtc
            };
        }

        private static string BuildReminderBody(SalesInvoice invoice)
        {
            var creditAmount = invoice.FinalTotal - invoice.PaidAmount;
            var dueDate = invoice.CreditDueDate?.ToString("yyyy-MM-dd") ?? "the due date";

            return $"""
                Dear {invoice.Customer.Name},

                This is a reminder that invoice {invoice.InvoiceNumber} has an unpaid credit balance.

                Invoice total: Rs. {invoice.FinalTotal:N2}
                Paid amount: Rs. {invoice.PaidAmount:N2}
                Remaining credit: Rs. {creditAmount:N2}
                Due date: {dueDate}

                Please clear the pending amount at your earliest convenience.

                Thank you,
                TorqueHub
                """;
        }
    }
}
