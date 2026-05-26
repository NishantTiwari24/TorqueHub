using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Reviews
{
    public class UpdateReviewRequestDto
    {
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [MaxLength(500)]
        public string Comment { get; set; } = string.Empty;
    }
}
