using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.PurchaseInvoice
{
    public class CreatePurchaseInvoiceItemRequestDto
    {
        [Range(1, int.MaxValue)]
        public int PartId { get; set; }

        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        [Required]
        [MaxLength(20)]
        [RegularExpression("^(New|Refurbished)$", ErrorMessage = "Condition must be New or Refurbished.")]
        public string Condition { get; set; } = "New";

        [Range(0, double.MaxValue)]
        public decimal UnitCost { get; set; }
    }
}
