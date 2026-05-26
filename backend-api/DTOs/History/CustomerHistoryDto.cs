namespace WeatherAPI.DTOs.History
{
    public class CustomerHistoryDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public IReadOnlyList<CustomerHistoryItemDto> Items { get; set; } = Array.Empty<CustomerHistoryItemDto>();
    }
}
