using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WeatherAPI.Models
{
    public class VehiclePartImage
    {
        [Key]
        public int ImageId { get; set; }

        [Required]
        public string ImageUrl { get; set; } = string.Empty;

        [Required]
        public int PartId { get; set; }

        [ForeignKey("PartId")]
        public virtual VehiclePart VehiclePart { get; set; } = null!;
    }
}
