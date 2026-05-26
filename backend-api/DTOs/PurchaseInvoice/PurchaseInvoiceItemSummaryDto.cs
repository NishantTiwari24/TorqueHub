namespace WeatherAPI.DTOs.PurchaseInvoice
{
    public class PurchaseInvoiceItemSummaryDto
    {
        public int PurchaseInvoiceItemId { get; set; }
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitCost { get; set; }
        public decimal LineTotal { get; set; }
    }
}
