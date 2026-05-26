using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeatherAPI.DTOs.StockTransaction;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/stock-transactions")]
    [Authorize(Roles = "Admin,Staff")]
    public class StockTransactionController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly ILogger<StockTransactionController> _logger;

        public StockTransactionController(
            AppDbContext dbContext,
            ILogger<StockTransactionController> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<StockTransactionSummaryDto>>> GetStockTransactionList()
        {
            var transactions = await _dbContext.StockTransactions
                .AsNoTracking()
                .Include(t => t.VehiclePart)
                .Include(t => t.SalesInvoice!)
                    .ThenInclude(i => i.Customer)
                .Include(t => t.SalesInvoice!)
                    .ThenInclude(i => i.Staff)
                .OrderByDescending(t => t.CreatedAtUtc)
                .ThenByDescending(t => t.StockTransactionId)
                .Select(t => new StockTransactionSummaryDto
                {
                    StockTransactionId = t.StockTransactionId,
                    PartId = t.PartId,
                    PartName = t.VehiclePart.Name,
                    QuantityChange = t.QuantityChange,
                    QuantityBefore = t.QuantityBefore,
                    QuantityAfter = t.QuantityAfter,
                    TransactionType = t.TransactionType,
                    ReferenceNumber = t.ReferenceNumber,
                    SalesInvoiceId = t.SalesInvoiceId,
                    CustomerName = t.SalesInvoice != null ? t.SalesInvoice.Customer!.Name : null,
                    StaffName = t.SalesInvoice != null ? t.SalesInvoice.Staff!.Name : null,
                    CreatedAtUtc = t.CreatedAtUtc
                })
                .ToListAsync();

            _logger.LogInformation("Stock transaction list requested. Returned {Count} records.", transactions.Count);
            return Ok(transactions);
        }
    }
}
