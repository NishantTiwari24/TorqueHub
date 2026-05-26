using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WeatherAPI.Models
{
    public class Vehicle
    {
        [Key]
        public int VehicleId { get; set; }

        [Required]
        [MaxLength(20)]
        public string VehicleNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Model { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Brand { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;

        public int? UserId { get; set; }

        [Required]
        public int Year { get; set; }

        [MaxLength(1000)]
        public string? ImageUrl { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }

        // Navigation Properties
        public virtual ICollection<Appointment> Appointments { get; set; } = new HashSet<Appointment>();
    }
}
