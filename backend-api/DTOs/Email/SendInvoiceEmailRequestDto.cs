using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Email
{
    public class SendInvoiceEmailRequestDto
    {
        public int? CustomerId { get; set; }

        [Required]
        [MaxLength(150)]
        [EmailAddress]
        public string RecipientEmail { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        public string Body { get; set; } = string.Empty;

        public bool IsBodyHtml { get; set; }

        [MaxLength(200)]
        public string? AttachmentFileName { get; set; }

        public string? AttachmentBase64 { get; set; }
    }
}
