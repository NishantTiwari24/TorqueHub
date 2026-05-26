using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Auth
{
    public class RegisterCustomerWithVehicleDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string VehicleNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Model { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Brand { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;

        [Range(1950, 3000)]
        public int Year { get; set; }

        [Url]
        [MaxLength(1000)]
        public string? VehicleImageUrl { get; set; }
    }
}
