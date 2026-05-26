using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WeatherAPI.DTOs.Email;
using WeatherAPI.DTOs.PurchaseInvoice;
using WeatherAPI.Services;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/admin/purchase-invoices")]
    [Authorize(Roles = "Admin")]
    public class AdminPurchaseInvoiceController : ControllerBase
    {
        private readonly IPurchaseInvoiceService _purchaseInvoiceService;
        private readonly IEmailService _emailService;
        private readonly AppDbContext _dbContext;
        private readonly ILogger<AdminPurchaseInvoiceController> _logger;

        public AdminPurchaseInvoiceController(
            IPurchaseInvoiceService purchaseInvoiceService,
            IEmailService emailService,
            AppDbContext dbContext,
            ILogger<AdminPurchaseInvoiceController> logger)
        {
            _purchaseInvoiceService = purchaseInvoiceService;
            _emailService = emailService;
            _dbContext = dbContext;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<PurchaseInvoiceSummaryDto>> CreatePurchaseInvoice([FromBody] CreatePurchaseInvoiceRequestDto request)
        {
            var result = await _purchaseInvoiceService.CreateAsync(request);
            if (!result.Success)
            {
                _logger.LogWarning("CreatePurchaseInvoice failed: {Message}", result.Error?.Message);
                return this.ToActionResult(result);
            }
            
            await TrySendVendorInvoiceEmailAsync(result.Data!);

            return CreatedAtAction(nameof(GetPurchaseInvoiceById), new { purchaseInvoiceId = result.Data!.PurchaseInvoiceId }, result.Data);
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<PurchaseInvoiceSummaryDto>>> GetPurchaseInvoiceList()
        {
            var result = await _purchaseInvoiceService.GetAllAsync();
            return this.ToActionResult(result);
        }

        [HttpGet("next-number")]
        public async Task<ActionResult<string>> GetNextInvoiceNumber([FromQuery] DateTime? invoiceDate = null)
        {
            var date = invoiceDate?.Date ?? DateTime.Today;
            var result = await _purchaseInvoiceService.GetNextInvoiceNumberAsync(date);
            return this.ToActionResult(result);
        }

        [HttpGet("{purchaseInvoiceId:int}")]
        public async Task<ActionResult<PurchaseInvoiceSummaryDto>> GetPurchaseInvoiceById(int purchaseInvoiceId)
        {
            var result = await _purchaseInvoiceService.GetByIdAsync(purchaseInvoiceId);
            return this.ToActionResult(result);
        }

        private async Task TrySendVendorInvoiceEmailAsync(PurchaseInvoiceSummaryDto invoice)
        {
            if (string.IsNullOrWhiteSpace(invoice.VendorEmail))
            {
                return;
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var sentByUserId))
            {
                return;
            }

            var adminUser = await _dbContext.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == sentByUserId);
            var adminName = string.IsNullOrWhiteSpace(adminUser?.Name) ? "Admin" : adminUser!.Name;
            var adminNumber = string.IsNullOrWhiteSpace(adminUser?.PhoneNumber) ? "AdminNumber" : adminUser!.PhoneNumber!;

            var body = $"""
                Dear Sir/Madam,

                I hope you are doing well.

                Please find the attached purchase invoice PDF for the recent vehicle parts purchase made for our TorqueHub.

                The invoice includes the purchased parts details, quantities, pricing, and total payable amount for stock update and inventory management purposes.

                Kindly review the attached invoice and confirm the purchase order at your earliest convenience.

                If any additional information or clarification is required, please feel free to contact us.

                Thank you for your cooperation.

                Best Regards,
                {adminName}, Admin
                TorqueHub
                {adminNumber}
                """;
            var pdfBytes = InvoicePdfBuilder.BuildPurchaseInvoicePdf(invoice);

            try
            {
                var request = new SendInvoiceEmailRequestDto
                {
                    CustomerId = null,
                    RecipientEmail = invoice.VendorEmail,
                    InvoiceNumber = invoice.InvoiceNumber,
                    Subject = "Purchase Order from TorqueHub",
                    Body = body,
                    IsBodyHtml = false,
                    AttachmentFileName = $"Purchase-Invoice-{invoice.InvoiceNumber}.pdf",
                    AttachmentBase64 = Convert.ToBase64String(pdfBytes),
                };

                var emailResult = await _emailService.SendInvoiceAsync(sentByUserId, request);
                if (!emailResult.IsSent)
                {
                    _logger.LogWarning("Purchase invoice email log saved as unsent for {InvoiceNumber}: {ErrorMessage}", invoice.InvoiceNumber, emailResult.ErrorMessage);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send purchase invoice email for {InvoiceNumber}", invoice.InvoiceNumber);
            }
        }
    }
}
