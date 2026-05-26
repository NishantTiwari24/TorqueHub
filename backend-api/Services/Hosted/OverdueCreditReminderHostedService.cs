using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services.Hosted
{
    public class OverdueCreditReminderHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<OverdueCreditReminderHostedService> _logger;

        public OverdueCreditReminderHostedService(IServiceProvider serviceProvider, ILogger<OverdueCreditReminderHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var reminderService = scope.ServiceProvider.GetRequiredService<ICreditReminderService>();
                    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
                    var admin = await userManager.Users.AsNoTracking().FirstOrDefaultAsync(u => u.IsActive, stoppingToken);

                    if (admin is not null && await userManager.IsInRoleAsync(admin, "Admin"))
                    {
                        var result = await reminderService.SendOverdueCreditRemindersAsync(admin.Id);
                        if (!result.Success)
                        {
                            _logger.LogWarning("Automated overdue credit reminder run failed: {Message}", result.Error?.Message);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Overdue credit reminder background run failed.");
                }

                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}
