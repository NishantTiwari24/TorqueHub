using WeatherAPI.DTOs.SalesInvoice;

namespace WeatherAPI.Services.Interfaces
{
    public interface ISalesInvoiceService
    {
        Task<ServiceResult<SalesInvoiceSummaryDto>> CreateAsync(CreateSalesInvoiceRequestDto request, int staffId);
        Task<ServiceResult<IReadOnlyList<SalesInvoiceSummaryDto>>> GetAllAsync();
        Task<ServiceResult<SalesInvoiceSummaryDto>> GetByIdAsync(int salesInvoiceId);
        Task<ServiceResult<string>> GetNextInvoiceNumberAsync(DateTime saleDate);
    }
}
