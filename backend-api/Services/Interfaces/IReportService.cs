using WeatherAPI.DTOs.Reports;

namespace WeatherAPI.Services.Interfaces
{
    public interface IReportService
    {
        Task<ServiceResult<FinancialReportDto>> GetDailyFinancialReportAsync(DateTime date);
        Task<ServiceResult<FinancialReportDto>> GetMonthlyFinancialReportAsync(int year, int month);
        Task<ServiceResult<FinancialReportDto>> GetYearlyFinancialReportAsync(int year);
        Task<ServiceResult<IReadOnlyList<CustomerReportDto>>> GetRegularCustomersAsync();
        Task<ServiceResult<IReadOnlyList<CustomerReportDto>>> GetHighSpendersAsync();
        Task<ServiceResult<IReadOnlyList<PendingCreditCustomerReportDto>>> GetPendingCreditCustomersAsync();
        Task<ServiceResult<IReadOnlyList<PendingCreditCustomerReportDto>>> GetOverdueCreditCustomersAsync();
    }
}
