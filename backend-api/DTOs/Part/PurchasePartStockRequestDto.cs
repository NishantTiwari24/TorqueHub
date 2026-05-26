using System.ComponentModel.DataAnnotations;

namespace WeatherAPI.DTOs.Part
{
    public class PurchasePartStockRequestDto
    {
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }
    }
}
