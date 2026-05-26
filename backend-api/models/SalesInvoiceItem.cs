using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WeatherAPI.Models
{
    public class SalesInvoiceItem
    {
        [Key]
        public int SalesInvoiceItemId { get; set; }

        [Required]
        public int SalesInvoiceId { get; set; }

        [ForeignKey("SalesInvoiceId")]
        public virtual SalesInvoice SalesInvoice { get; set; } = null!;

        [Required]
        public int PartId { get; set; }

        [ForeignKey("PartId")]
        public virtual VehiclePart VehiclePart { get; set; } = null!;

        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        [Range(0, double.MaxValue)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Range(0, double.MaxValue)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal LineTotal { get; set; }
    }
}
