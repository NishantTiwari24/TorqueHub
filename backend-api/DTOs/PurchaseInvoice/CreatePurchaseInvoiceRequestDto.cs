using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.PurchaseInvoice
{
    public class CreatePurchaseInvoiceRequestDto
    {
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int VendorId { get; set; }

        public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        [Required]
        [MinLength(1)]
        public List<CreatePurchaseInvoiceItemRequestDto> Items { get; set; } = new();
    }
}
