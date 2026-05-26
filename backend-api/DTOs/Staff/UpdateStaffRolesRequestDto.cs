using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Staff
{
    public class UpdateStaffRolesRequestDto
    {
        [Required]
        [MinLength(1)]
        public List<string> Roles { get; set; } = new();
    }
}
