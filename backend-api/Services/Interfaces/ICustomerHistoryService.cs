using WeatherAPI.DTOs.History;

namespace WeatherAPI.Services.Interfaces
{
    public interface ICustomerHistoryService
    {
        Task<CustomerHistoryDto?> GetFullHistoryForUserAsync(int userId, string? userEmail);
        Task<CustomerHistoryDto?> GetPurchaseHistoryForUserAsync(int userId, string? userEmail);
        Task<CustomerHistoryDto?> GetServiceHistoryForUserAsync(int userId, string? userEmail);
        Task<CustomerHistoryDto?> GetFullHistoryForCustomerAsync(int customerId);
        Task<CustomerHistoryDto?> GetPurchaseHistoryForCustomerAsync(int customerId);
    }
}
