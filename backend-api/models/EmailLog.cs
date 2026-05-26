using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WeatherAPI.Models
{
    public class EmailLog
    {
        [Key]
        public int EmailLogId { get; set; }

        public int? UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }

        public int? SentByUserId { get; set; }

        [ForeignKey(nameof(SentByUserId))]
        public virtual User? SentByUser { get; set; }

        [Required]
        [MaxLength(150)]
        [EmailAddress]
        public string RecipientEmail { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        public string Body { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? ReferenceNumber { get; set; }

        [Required]
        [MaxLength(30)]
        public string EmailType { get; set; } = "Invoice";

        public bool IsSent { get; set; }

        [MaxLength(1000)]
        public string? ErrorMessage { get; set; }

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public DateTime? SentAtUtc { get; set; }
    }
}
