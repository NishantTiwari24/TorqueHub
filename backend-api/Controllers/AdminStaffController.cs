using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.Staff;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/admin/staff")]
    [Authorize(Roles = "Admin")]
    public class AdminStaffController : ControllerBase
    {
        private readonly IStaffService _staffService;

        public AdminStaffController(IStaffService staffService)
        {
            _staffService = staffService;
        }

        [HttpPost]
        public async Task<ActionResult<StaffSummaryDto>> CreateStaff([FromBody] CreateStaffRequestDto request)
        {
            var result = await _staffService.CreateAsync(request);
            if (!result.Success)
            {
                return this.ToActionResult(result);
            }

            return CreatedAtAction(nameof(GetStaffById), new { staffId = result.Data!.UserId }, result.Data);
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<StaffSummaryDto>>> GetStaffList()
        {
            return this.ToActionResult(await _staffService.GetAllAsync());
        }

        [HttpGet("{staffId:int}")]
        public async Task<ActionResult<StaffSummaryDto>> GetStaffById(int staffId)
        {
            return this.ToActionResult(await _staffService.GetByIdAsync(staffId));
        }

        [HttpPut("{staffId:int}")]
        public async Task<ActionResult<StaffSummaryDto>> UpdateStaff(int staffId, [FromBody] UpdateStaffRequestDto request)
        {
            return this.ToActionResult(await _staffService.UpdateAsync(staffId, request));
        }

        [HttpDelete("{staffId:int}")]
        public async Task<IActionResult> DeleteStaff(int staffId)
        {
            var result = await _staffService.DeleteAsync(staffId);
            if (!result.Success)
            {
                return this.ToActionResult(result);
            }

            return NoContent();
        }
    }
}
