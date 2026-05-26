using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.Appointments;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/appointments")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;

        public AppointmentsController(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        [HttpGet("my")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<IReadOnlyList<AppointmentSummaryDto>>> GetMyAppointments()
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            return this.ToActionResult(await _appointmentService.GetForUserAsync(userContext.Value.UserId, userContext.Value.Email));
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<AppointmentSummaryDto>> CreateAppointment([FromBody] CreateAppointmentRequestDto request)
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            var result = await _appointmentService.CreateAsync(userContext.Value.UserId, userContext.Value.Email, request);
            if (!result.Success)
            {
                return this.ToActionResult(result);
            }

            return Created($"/api/appointments/{result.Data!.AppointmentId}", result.Data);
        }

        [HttpPut("{id:int}/reschedule")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<AppointmentSummaryDto>> RescheduleAppointment(int id, [FromBody] RescheduleAppointmentRequestDto request)
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            return this.ToActionResult(await _appointmentService.RescheduleAsync(id, userContext.Value.UserId, userContext.Value.Email, request));
        }

        [HttpPatch("{id:int}/cancel")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<AppointmentSummaryDto>> CancelAppointment(int id)
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            return this.ToActionResult(await _appointmentService.CancelAsync(id, userContext.Value.UserId, userContext.Value.Email));
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<IReadOnlyList<AppointmentSummaryDto>>> GetAppointments()
        {
            return this.ToActionResult(await _appointmentService.GetAllAsync());
        }

        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<AppointmentSummaryDto>> UpdateAppointmentStatus(int id, [FromBody] UpdateAppointmentStatusRequestDto request)
        {
            return this.ToActionResult(await _appointmentService.UpdateStatusAsync(id, request));
        }

        private (int UserId, string? Email)? GetCurrentUserContext()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return null;
            }

            return (userId, User.FindFirstValue(ClaimTypes.Email));
        }
    }
}
