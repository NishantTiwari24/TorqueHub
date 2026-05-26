namespace WeatherAPI.DTOs.Appointments
{
    public class AppointmentSummaryDto
    {
        public int AppointmentId { get; set; }
        public int UserId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string ServiceType { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
