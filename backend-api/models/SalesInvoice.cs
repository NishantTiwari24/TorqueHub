using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WeatherAPI.Models
{
    public class SalesInvoice
    {
        [Key]
        public int SalesInvoiceId { get; set; }

        [Required]
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        public int CustomerId { get; set; }

        [ForeignKey("CustomerId")]
        public virtual User Customer { get; set; } = null!;

        [Required]
        public int StaffId { get; set; }

        [ForeignKey("StaffId")]
        public virtual User Staff { get; set; } = null!;

        public DateTime SaleDate { get; set; } = DateTime.UtcNow;

        [Range(0, double.MaxValue)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }

        [Range(0, double.MaxValue)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Discount { get; set; }

        [Range(0, double.MaxValue)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal FinalTotal { get; set; }

        [Range(0, double.MaxValue)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PaidAmount { get; set; }

        [Required]
        [MaxLength(20)]
        public string PaymentStatus { get; set; } = "Paid";

        public DateTime? CreditDueDate { get; set; }

        public DateTime? LastCreditReminderSentAtUtc { get; set; }

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public virtual ICollection<SalesInvoiceItem> Items { get; set; } = new HashSet<SalesInvoiceItem>();

        public virtual ICollection<StockTransaction> StockTransactions { get; set; } = new HashSet<StockTransaction>();
    }
}
