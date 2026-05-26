using Microsoft.AspNetCore.Identity;

namespace WeatherAPI.Models
{
    public class User : IdentityUser<int>
    {
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public string? ProfileImageUrl { get; set; }

        // Navigation Properties
        public virtual ICollection<Notification> Notifications { get; set; } = new HashSet<Notification>();
        public virtual ICollection<Order> Orders { get; set; } = new HashSet<Order>();
        public virtual ICollection<Vehicle> Vehicles { get; set; } = new HashSet<Vehicle>();
        public virtual ICollection<Appointment> Appointments { get; set; } = new HashSet<Appointment>();
        public virtual ICollection<SalesInvoice> CustomerSalesInvoices { get; set; } = new HashSet<SalesInvoice>();
        public virtual ICollection<SalesInvoice> StaffSalesInvoices { get; set; } = new HashSet<SalesInvoice>();
    }
}
