namespace WeatherAPI.DTOs.SalesInvoice
{
    public class SalesInvoiceItemSummaryDto
    {
        public int SalesInvoiceItemId { get; set; }
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }
}
