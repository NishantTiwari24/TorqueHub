using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.SalesInvoice
{
    public class CreateSalesInvoiceRequestDto
    {
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int CustomerId { get; set; }

        public DateTime SaleDate { get; set; } = DateTime.UtcNow;

        [Range(0, double.MaxValue)]
        public decimal? PaidAmount { get; set; }

        public DateTime? CreditDueDate { get; set; }

        [Required]
        [MinLength(1)]
        public List<CreateSalesInvoiceItemRequestDto> Items { get; set; } = new();
    }
}
