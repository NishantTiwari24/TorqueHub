using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeatherAPI.DTOs.Email;
using WeatherAPI.DTOs.SalesInvoice;
using WeatherAPI.Services;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/staff/sales-invoices")]
    [Authorize(Roles = "Admin,Staff")]
    public class StaffSalesInvoiceController : ControllerBase
    {
        private readonly ISalesInvoiceService _salesInvoiceService;
        private readonly IEmailService _emailService;
        private readonly AppDbContext _dbContext;
        private readonly ILogger<StaffSalesInvoiceController> _logger;

        public StaffSalesInvoiceController(
            ISalesInvoiceService salesInvoiceService,
            IEmailService emailService,
            AppDbContext dbContext,
            ILogger<StaffSalesInvoiceController> logger)
        {
            _salesInvoiceService = salesInvoiceService;
            _emailService = emailService;
            _dbContext = dbContext;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<SalesInvoiceSummaryDto>> CreateSalesInvoice([FromBody] CreateSalesInvoiceRequestDto request)
        {
            var staffIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(staffIdValue, out var staffId))
            {
                return Unauthorized(new { success = false, message = "Invalid staff token." });
            }

            var result = await _salesInvoiceService.CreateAsync(request, staffId);
            if (!result.Success)
            {
                _logger.LogWarning("CreateSalesInvoice failed for StaffId {StaffId}: {Message}", staffId, result.Error?.Message);
                return this.ToActionResult(result);
            }
            
            await TrySendCustomerInvoiceEmailAsync(result.Data!, staffId);

            return CreatedAtAction(nameof(GetSalesInvoiceById), new { salesInvoiceId = result.Data!.SalesInvoiceId }, result.Data);
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<SalesInvoiceSummaryDto>>> GetSalesInvoiceList()
        {
            var result = await _salesInvoiceService.GetAllAsync();
            return this.ToActionResult(result);
        }

        [HttpGet("next-number")]
        public async Task<ActionResult<string>> GetNextInvoiceNumber([FromQuery] DateTime? saleDate = null)
        {
            var date = saleDate?.Date ?? DateTime.Today;
            var result = await _salesInvoiceService.GetNextInvoiceNumberAsync(date);
            return this.ToActionResult(result);
        }

        [HttpGet("{salesInvoiceId:int}")]
        public async Task<ActionResult<SalesInvoiceSummaryDto>> GetSalesInvoiceById(int salesInvoiceId)
        {
            var result = await _salesInvoiceService.GetByIdAsync(salesInvoiceId);
            return this.ToActionResult(result);
        }

        private async Task TrySendCustomerInvoiceEmailAsync(SalesInvoiceSummaryDto invoice, int sentByUserId)
        {
            var customer = await _dbContext.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == invoice.CustomerId);
            if (string.IsNullOrWhiteSpace(customer?.Email))
            {
                return;
            }

            var staffUser = await _dbContext.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == sentByUserId);
            var staffName = string.IsNullOrWhiteSpace(staffUser?.Name) ? "Staff" : staffUser!.Name;
            var staffNumber = string.IsNullOrWhiteSpace(staffUser?.PhoneNumber) ? "N/A" : staffUser!.PhoneNumber!;

            var body = $"""
                Dear {invoice.CustomerName},

                Thank you for choosing TorqueHub.

                Please find the attached sales invoice PDF for your recent purchase.

                The invoice includes purchased part details, quantities, pricing, and final payable amount.

                If you have any questions, please feel free to contact us.

                Best Regards,
                {staffName}
                TorqueHub
                {staffNumber}
                """;
            var pdfBytes = InvoicePdfBuilder.BuildSalesInvoicePdf(invoice);

            try
            {
                var request = new SendInvoiceEmailRequestDto
                {
                    CustomerId = invoice.CustomerId,
                    RecipientEmail = customer.Email!,
                    InvoiceNumber = invoice.InvoiceNumber,
                    Subject = $"Sales Invoice from TorqueHub - {invoice.InvoiceNumber}",
                    Body = body,
                    IsBodyHtml = false,
                    AttachmentFileName = $"Sales-Invoice-{invoice.InvoiceNumber}.pdf",
                    AttachmentBase64 = Convert.ToBase64String(pdfBytes),
                };

                var emailResult = await _emailService.SendInvoiceAsync(sentByUserId, request);
                if (!emailResult.IsSent)
                {
                    _logger.LogWarning("Sales invoice email log saved as unsent for {InvoiceNumber}: {ErrorMessage}", invoice.InvoiceNumber, emailResult.ErrorMessage);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send sales invoice email for {InvoiceNumber}", invoice.InvoiceNumber);
            }
        }
    }
}
