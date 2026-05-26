using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.PartRequests
{
    public class CreateCustomerPartRequestDto
    {
        public int? VehicleId { get; set; }

        [Required]
        [MaxLength(100)]
        public string PartName { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; } = 1;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
    }
}
