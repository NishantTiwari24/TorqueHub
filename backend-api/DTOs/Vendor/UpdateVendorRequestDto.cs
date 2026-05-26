using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Vendor
{
    public class UpdateVendorRequestDto
    {
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
    }
}
