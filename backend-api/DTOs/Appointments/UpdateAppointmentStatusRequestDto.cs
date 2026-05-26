using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Appointments
{
    public class UpdateAppointmentStatusRequestDto
    {
        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = string.Empty;
    }
}
