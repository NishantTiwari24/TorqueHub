using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WeatherAPI.Models
{
    public class PurchaseInvoice
    {
        [Key]
        public int PurchaseInvoiceId { get; set; }

        [Required]
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        public int VendorId { get; set; }

        [ForeignKey("VendorId")]
        public virtual Vendor Vendor { get; set; } = null!;

        public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        [Range(0, double.MaxValue)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public virtual ICollection<PurchaseInvoiceItem> Items { get; set; } = new HashSet<PurchaseInvoiceItem>();
    }
}
