namespace WeatherAPI.DTOs.PartRequests
{
    public class PartRequestSummaryDto
    {
        public int PartRequestId { get; set; }
        public int UserId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int? VehicleId { get; set; }
        public string? VehicleName { get; set; }
        public string PartName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? StaffNotes { get; set; }
        public DateTime RequestedAtUtc { get; set; }
        public DateTime? UpdatedAtUtc { get; set; }
    }
}
