using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WeatherAPI.Models
{
    public class VehiclePart
    {
        [Key]
        public int PartId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Descriptions { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Condition { get; set; } = "New";

        [Range(0, double.MaxValue)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Range(0, int.MaxValue)]
        public int StockQuantity { get; set; }

        public bool IsDeleted { get; set; } = false;

        [Required]
        public int VendorId { get; set; }

        [ForeignKey("VendorId")]
        public virtual Vendor Vendor { get; set; } = null!;

        // Navigation for M:N Relationship
        public virtual ICollection<OrderPart> OrderParts { get; set; } = new HashSet<OrderPart>();

        // Navigation for Multiple Images
        public virtual ICollection<VehiclePartImage> PartImages { get; set; } = new HashSet<VehiclePartImage>();

        public virtual ICollection<PurchaseInvoiceItem> PurchaseInvoiceItems { get; set; } = new HashSet<PurchaseInvoiceItem>();

        public virtual ICollection<SalesInvoiceItem> SalesInvoiceItems { get; set; } = new HashSet<SalesInvoiceItem>();

        public virtual ICollection<StockTransaction> StockTransactions { get; set; } = new HashSet<StockTransaction>();
    }
}
