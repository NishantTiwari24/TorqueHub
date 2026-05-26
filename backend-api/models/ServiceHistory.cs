
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace WeatherAPI.Models
{
    public class ServiceHistory
    {
        [Key]
        public int ServiceHistoryId { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;

        public int? AppointmentId { get; set; }

        [ForeignKey(nameof(AppointmentId))]
        public virtual Appointment? Appointment { get; set; }

        [Required]
        [MaxLength(30)]
        public string HistoryType { get; set; } = "Service";

        [Required]
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? ReferenceNumber { get; set; }

        public DateTime EventDateUtc { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Amount { get; set; }
    }
}
