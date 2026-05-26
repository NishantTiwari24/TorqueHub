namespace WeatherAPI.DTOs.Reviews
{
    public class ReviewSummaryDto
    {
        public int ReviewId { get; set; }
        public int UserId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int? AppointmentId { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public DateTime? UpdatedAtUtc { get; set; }
    }
}
