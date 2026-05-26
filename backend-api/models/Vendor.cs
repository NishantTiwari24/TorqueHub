using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.Models
{
    public class Vendor
    {
        [Key]
        public int VendorId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        [MaxLength(20)]
        public string PhoneNo { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Address { get; set; } = string.Empty;

        // Navigation Properties
        public virtual ICollection<VehiclePart> VehicleParts { get; set; } = new HashSet<VehiclePart>();
        public virtual ICollection<PurchaseInvoice> PurchaseInvoices { get; set; } = new HashSet<PurchaseInvoice>();
    }
}
