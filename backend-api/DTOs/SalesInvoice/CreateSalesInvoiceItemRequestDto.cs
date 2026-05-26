using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.SalesInvoice
{
    public class CreateSalesInvoiceItemRequestDto
    {
        [Range(1, int.MaxValue)]
        public int PartId { get; set; }

        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

    }
}
