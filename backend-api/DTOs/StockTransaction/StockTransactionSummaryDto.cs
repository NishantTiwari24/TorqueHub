namespace WeatherAPI.DTOs.StockTransaction
{
    public class StockTransactionSummaryDto
    {
        public int StockTransactionId { get; set; }
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public int QuantityChange { get; set; }
        public int QuantityBefore { get; set; }
        public int QuantityAfter { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public string ReferenceNumber { get; set; } = string.Empty;
        public int? SalesInvoiceId { get; set; }
        public string? CustomerName { get; set; }
        public string? StaffName { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }
}
