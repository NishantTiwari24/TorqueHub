using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.Staff;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/admin/staff")]
    [Authorize(Roles = "Admin")]
    public class AdminRoleController : ControllerBase
    {
        private readonly IRoleManagementService _roleManagementService;

        public AdminRoleController(IRoleManagementService roleManagementService)
        {
            _roleManagementService = roleManagementService;
        }

        [HttpGet("{id:int}/roles")]
        public async Task<ActionResult<IReadOnlyList<string>>> GetRoles(int id)
        {
            var adminUserId = GetCurrentUserId();
            if (!adminUserId.HasValue)
            {
                return Unauthorized(new { success = false, message = "Invalid admin token." });
            }

            return this.ToActionResult(await _roleManagementService.GetRolesAsync(id, adminUserId.Value));
        }

        [HttpPost("{id:int}/roles")]
        public async Task<ActionResult<IReadOnlyList<string>>> AssignRoles(int id, [FromBody] UpdateStaffRolesRequestDto request)
        {
            var adminUserId = GetCurrentUserId();
            if (!adminUserId.HasValue)
            {
                return Unauthorized(new { success = false, message = "Invalid admin token." });
            }

            return this.ToActionResult(await _roleManagementService.AssignRolesAsync(id, request.Roles, adminUserId.Value));
        }

        [HttpDelete("{id:int}/roles/{role}")]
        public async Task<ActionResult<IReadOnlyList<string>>> RevokeRole(int id, string role)
        {
            var adminUserId = GetCurrentUserId();
            if (!adminUserId.HasValue)
            {
                return Unauthorized(new { success = false, message = "Invalid admin token." });
            }

            return this.ToActionResult(await _roleManagementService.RevokeRoleAsync(id, role, adminUserId.Value));
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }
}
