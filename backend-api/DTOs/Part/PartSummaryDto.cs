namespace WeatherAPI.DTOs.Part
{
    public class PartSummaryDto
    {
        public int PartId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Descriptions { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Condition { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int VendorId { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public string VendorEmail { get; set; } = string.Empty;
        public List<string> ImageUrls { get; set; } = new();
    }
}
