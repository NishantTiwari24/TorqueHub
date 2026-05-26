using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.Email;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/email")]
    [Authorize(Roles = "Admin,Staff")]
    public class EmailController : ControllerBase
    {
        private readonly IEmailService _emailService;

        public EmailController(IEmailService emailService)
        {
            _emailService = emailService;
        }

        [HttpPost("invoices/send")]
        public async Task<ActionResult<EmailLogSummaryDto>> SendInvoiceEmail([FromBody] SendInvoiceEmailRequestDto request)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            var result = await _emailService.SendInvoiceAsync(userId.Value, request);
            return Created($"/api/email/logs/{result.EmailLogId}", result);
        }

        [HttpGet("logs")]
        public async Task<ActionResult<IReadOnlyList<EmailLogSummaryDto>>> GetEmailLogs()
        {
            var result = await _emailService.GetLogsAsync();
            return Ok(result);
        }

        [HttpGet("logs/{id:int}")]
        public async Task<ActionResult<EmailLogSummaryDto>> GetEmailLogById(int id)
        {
            var result = await _emailService.GetLogByIdAsync(id);
            if (result is null)
            {
                return NotFound(new { success = false, message = "Email log not found." });
            }

            return Ok(result);
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }
}
