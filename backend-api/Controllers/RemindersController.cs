using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.Reminders;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/reminders")]
    [Authorize(Roles = "Admin")]
    public class RemindersController : ControllerBase
    {
        private readonly ICreditReminderService _creditReminderService;

        public RemindersController(ICreditReminderService creditReminderService)
        {
            _creditReminderService = creditReminderService;
        }

        [HttpPost("run")]
        public async Task<ActionResult<CreditReminderResultDto>> RunOverdueCreditReminders()
        {
            var adminUserId = GetCurrentUserId();
            if (!adminUserId.HasValue)
            {
                return Unauthorized(new { success = false, message = "Invalid admin token." });
            }

            var result = await _creditReminderService.SendOverdueCreditRemindersAsync(adminUserId.Value);
            return this.ToActionResult(result);
        }

        [HttpPost("send-overdue-credit-reminders")]
        public async Task<ActionResult<CreditReminderResultDto>> SendOverdueCreditReminders()
        {
            return await RunOverdueCreditReminders();
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }
}
