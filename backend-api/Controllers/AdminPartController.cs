using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WeatherAPI.DTOs.Email;
using WeatherAPI.DTOs.Part;
using WeatherAPI.Services;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/admin/parts")]
    [Authorize(Roles = "Admin")]
    public class AdminPartController : ControllerBase
    {
        private readonly IPartService _partService;
        private readonly IEmailService _emailService;
        private readonly AppDbContext _dbContext;
        private readonly ILogger<AdminPartController> _logger;

        public AdminPartController(IPartService partService, IEmailService emailService, AppDbContext dbContext, ILogger<AdminPartController> logger)
        {
            _partService = partService;
            _emailService = emailService;
            _dbContext = dbContext;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<PartSummaryDto>> CreatePart([FromBody] CreatePartRequestDto request)
        {
            var result = await _partService.CreateAsync(request);
            if (!result.Success)
            {
                return this.ToActionResult(result);
            }

            if (request.StockQuantity > 0)
            {
                await TrySendOpeningStockEmailAsync(result.Data!, request);
            }

            return CreatedAtAction(nameof(GetPartById), new { partId = result.Data!.PartId }, result.Data);
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<PartSummaryDto>>> GetPartList()
        {
            return this.ToActionResult(await _partService.GetAllAsync());
        }

        [HttpGet("{partId:int}")]
        public async Task<ActionResult<PartSummaryDto>> GetPartById(int partId)
        {
            return this.ToActionResult(await _partService.GetByIdAsync(partId));
        }

        [HttpPut("{partId:int}")]
        public async Task<ActionResult<PartSummaryDto>> UpdatePart(int partId, [FromBody] UpdatePartRequestDto request)
        {
            return this.ToActionResult(await _partService.UpdateAsync(partId, request));
        }

        [HttpPost("{partId:int}/purchase")]
        public async Task<ActionResult<PartSummaryDto>> PurchasePartStock(int partId, [FromBody] PurchasePartStockRequestDto request)
        {
            return this.ToActionResult(await _partService.PurchaseAsync(partId, request));
        }

        [HttpDelete("{partId:int}")]
        public async Task<IActionResult> DeletePart(int partId)
        {
            var result = await _partService.DeleteAsync(partId);
            if (!result.Success)
            {
                return this.ToActionResult(result);
            }

            return NoContent();
        }

        private async Task TrySendOpeningStockEmailAsync(PartSummaryDto part, CreatePartRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(part.VendorEmail) || string.IsNullOrWhiteSpace(request.OpeningInvoiceNumber))
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
            var pdfBytes = InvoicePdfBuilder.BuildOpeningStockInvoicePdf(
                request.OpeningInvoiceNumber.Trim(),
                part.VendorName,
                part.Name,
                request.StockQuantity,
                request.Condition,
                part.Price,
                part.ImageUrls.FirstOrDefault());

            try
            {
                var emailResult = await _emailService.SendInvoiceAsync(sentByUserId, new SendInvoiceEmailRequestDto
                {
                    CustomerId = null,
                    RecipientEmail = part.VendorEmail,
                    InvoiceNumber = request.OpeningInvoiceNumber.Trim(),
                    Subject = "Purchase Order from TorqueHub",
                    Body = body,
                    IsBodyHtml = false,
                    AttachmentFileName = $"Purchase-Invoice-{request.OpeningInvoiceNumber.Trim()}.pdf",
                    AttachmentBase64 = Convert.ToBase64String(pdfBytes),
                });

                if (!emailResult.IsSent)
                {
                    _logger.LogWarning("Opening stock email logged as unsent for invoice {InvoiceNumber}: {Error}", request.OpeningInvoiceNumber, emailResult.ErrorMessage);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed sending opening stock email for invoice {InvoiceNumber}", request.OpeningInvoiceNumber);
            }
        }
    }
}
