using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Appointments
{
    public class RescheduleAppointmentRequestDto
    {
        [Required]
        public DateTime Date { get; set; }
    }
}
