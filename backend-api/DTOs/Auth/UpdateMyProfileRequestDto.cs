using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Auth
{
    public class UpdateMyProfileRequestDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Phone]
        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [Url]
        [MaxLength(1000)]
        public string? ProfileImageUrl { get; set; }
    }
}
