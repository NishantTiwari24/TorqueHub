using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WeatherAPI.Models
{
    public class PurchaseInvoiceItem
    {
        [Key]
        public int PurchaseInvoiceItemId { get; set; }

        [Required]
        public int PurchaseInvoiceId { get; set; }

        [ForeignKey("PurchaseInvoiceId")]
        public virtual PurchaseInvoice PurchaseInvoice { get; set; } = null!;

        [Required]
        public int PartId { get; set; }

        [ForeignKey("PartId")]
        public virtual VehiclePart VehiclePart { get; set; } = null!;

        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        [Range(0, double.MaxValue)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitCost { get; set; }

        [Range(0, double.MaxValue)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal LineTotal { get; set; }
    }
}
