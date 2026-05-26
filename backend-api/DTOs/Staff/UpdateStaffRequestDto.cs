using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Staff
{
    public class UpdateStaffRequestDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}
