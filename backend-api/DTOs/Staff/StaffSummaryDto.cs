namespace WeatherAPI.DTOs.Staff
{
    public class StaffSummaryDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public IReadOnlyList<string> Roles { get; set; } = Array.Empty<string>();
    }
}
