using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WeatherAPI.Models
{
    public class OrderPart
    {
        [Required]
        public int OrderId { get; set; }

        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; } = null!;

        [Required]
        public int PartId { get; set; }

        [ForeignKey("PartId")]
        public virtual VehiclePart VehiclePart { get; set; } = null!;
    }
}
