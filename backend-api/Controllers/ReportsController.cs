using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.Reports;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/reports")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("financial/daily")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<FinancialReportDto>> GetDailyFinancialReport([FromQuery] DateTime? date)
        {
            if (!date.HasValue)
            {
                return BadRequest(new { success = false, message = "Date is required. Use YYYY-MM-DD." });
            }

            var result = await _reportService.GetDailyFinancialReportAsync(date.Value);
            return this.ToActionResult(result);
        }

        [HttpGet("financial/monthly")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<FinancialReportDto>> GetMonthlyFinancialReport([FromQuery] int year, [FromQuery] int month)
        {
            var result = await _reportService.GetMonthlyFinancialReportAsync(year, month);
            return this.ToActionResult(result);
        }

        [HttpGet("financial/yearly")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<FinancialReportDto>> GetYearlyFinancialReport([FromQuery] int year)
        {
            var result = await _reportService.GetYearlyFinancialReportAsync(year);
            return this.ToActionResult(result);
        }

        [HttpGet("customers/regulars")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<IReadOnlyList<CustomerReportDto>>> GetRegularCustomers()
        {
            var result = await _reportService.GetRegularCustomersAsync();
            return this.ToActionResult(result);
        }

        [HttpGet("customers/high-spenders")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<IReadOnlyList<CustomerReportDto>>> GetHighSpenders()
        {
            var result = await _reportService.GetHighSpendersAsync();
            return this.ToActionResult(result);
        }

        [HttpGet("customers/pending-credits")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<IReadOnlyList<PendingCreditCustomerReportDto>>> GetPendingCreditCustomers()
        {
            var result = await _reportService.GetPendingCreditCustomersAsync();
            return this.ToActionResult(result);
        }

        [HttpGet("customers/overdue-credits")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<IReadOnlyList<PendingCreditCustomerReportDto>>> GetOverdueCreditCustomers()
        {
            var result = await _reportService.GetOverdueCreditCustomersAsync();
            return this.ToActionResult(result);
        }
    }
}
