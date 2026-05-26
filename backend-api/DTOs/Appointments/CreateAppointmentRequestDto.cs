using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Appointments
{
    public class CreateAppointmentRequestDto
    {
        [Required]
        public int VehicleId { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        [MaxLength(100)]
        public string ServiceType { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}
