namespace WeatherAPI.DTOs.Auth
{
    public class UserSummaryDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
    }
}
