using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WeatherAPI.Models
{
    public class StockTransaction
    {
        [Key]
        public int StockTransactionId { get; set; }

        [Required]
        public int PartId { get; set; }

        [ForeignKey("PartId")]
        public virtual VehiclePart VehiclePart { get; set; } = null!;

        public int QuantityChange { get; set; }

        public int QuantityBefore { get; set; }

        public int QuantityAfter { get; set; }

        [Required]
        [MaxLength(50)]
        public string TransactionType { get; set; } = string.Empty;

        [MaxLength(50)]
        public string ReferenceNumber { get; set; } = string.Empty;

        public int? SalesInvoiceId { get; set; }

        [ForeignKey("SalesInvoiceId")]
        public virtual SalesInvoice? SalesInvoice { get; set; }

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}
