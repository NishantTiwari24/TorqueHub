using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Reviews
{
    public class CreateReviewRequestDto
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int AppointmentId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [MaxLength(500)]
        public string Comment { get; set; } = string.Empty;
    }
}
