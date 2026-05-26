namespace WeatherAPI.DTOs.PurchaseInvoice
{
    public class PurchaseInvoiceSummaryDto
    {
        public int PurchaseInvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public int VendorId { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public string VendorEmail { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public string Notes { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public IReadOnlyList<PurchaseInvoiceItemSummaryDto> Items { get; set; } = Array.Empty<PurchaseInvoiceItemSummaryDto>();
    }
}
