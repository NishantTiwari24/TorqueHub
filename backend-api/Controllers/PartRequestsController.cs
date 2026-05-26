using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.PartRequests;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/part-requests")]
    [Authorize]
    public class PartRequestsController : ControllerBase
    {
        private readonly IPartRequestService _partRequestService;

        public PartRequestsController(IPartRequestService partRequestService)
        {
            _partRequestService = partRequestService;
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<PartRequestSummaryDto>> CreatePartRequest([FromBody] CreateCustomerPartRequestDto request)
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            var result = await _partRequestService.CreateAsync(userContext.Value.UserId, userContext.Value.Email, request);
            if (!result.Success)
            {
                return this.ToActionResult(result);
            }

            return Created($"/api/part-requests/{result.Data!.PartRequestId}", result.Data);
        }

        [HttpGet("my")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<IReadOnlyList<PartRequestSummaryDto>>> GetMyPartRequests()
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            return this.ToActionResult(await _partRequestService.GetForUserAsync(userContext.Value.UserId, userContext.Value.Email));
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<PartRequestSummaryDto>> GetMyPartRequestById(int id)
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            return this.ToActionResult(await _partRequestService.GetForUserByIdAsync(id, userContext.Value.UserId, userContext.Value.Email));
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> DeleteMyPartRequest(int id)
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            var result = await _partRequestService.DeleteForUserAsync(id, userContext.Value.UserId, userContext.Value.Email);
            if (!result.Success)
            {
                return this.ToActionResult(result);
            }

            return NoContent();
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<IReadOnlyList<PartRequestSummaryDto>>> GetPartRequests()
        {
            return this.ToActionResult(await _partRequestService.GetAllAsync());
        }

        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<PartRequestSummaryDto>> UpdatePartRequestStatus(int id, [FromBody] UpdatePartRequestStatusDto request)
        {
            return this.ToActionResult(await _partRequestService.UpdateStatusAsync(id, request));
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
