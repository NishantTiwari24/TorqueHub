using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.PartRequests
{
    public class UpdatePartRequestStatusDto
    {
        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? StaffNotes { get; set; }
    }
}
