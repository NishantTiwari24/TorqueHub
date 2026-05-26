using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Part
{
    public class UpdatePartRequestDto
    {
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
        public string Condition { get; set; } = string.Empty;

        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        [Range(0, int.MaxValue)]
        public int StockQuantity { get; set; }

        [Required]
        public int VendorId { get; set; }

        public List<string> ImageUrls { get; set; } = new();
    }
}
