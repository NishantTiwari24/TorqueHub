using WeatherAPI.DTOs.PurchaseInvoice;

namespace WeatherAPI.Services.Interfaces
{
    public interface IPurchaseInvoiceService
    {
        Task<ServiceResult<PurchaseInvoiceSummaryDto>> CreateAsync(CreatePurchaseInvoiceRequestDto request);
        Task<ServiceResult<IReadOnlyList<PurchaseInvoiceSummaryDto>>> GetAllAsync();
        Task<ServiceResult<PurchaseInvoiceSummaryDto>> GetByIdAsync(int purchaseInvoiceId);
        Task<ServiceResult<string>> GetNextInvoiceNumberAsync(DateTime invoiceDate);
    }
}
