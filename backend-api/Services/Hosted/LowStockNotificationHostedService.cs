using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services.Hosted
{
    public class LowStockNotificationHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<LowStockNotificationHostedService> _logger;

        public LowStockNotificationHostedService(IServiceProvider serviceProvider, ILogger<LowStockNotificationHostedService> logger)
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
                    var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    
                    var result = await notificationService.CheckLowStockAsync();
                    if (!result.Success)
                    {
                        _logger.LogWarning("Automated low stock notification check failed: {Message}", result.Error?.Message);
                    }
                    else
                    {
                        _logger.LogInformation("Low stock notification check completed successfully. Checked {PartCount} parts, {AdminCount} admins.", 
                            result.Data?.LowStockPartCount ?? 0, 
                            result.Data?.AdminCount ?? 0);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Low stock notification background check failed.");
                }

                // Run every 10 seconds for debugging
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }
    }
}
