using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.Vendor;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/admin/vendors")]
    [Authorize(Roles = "Admin")]
    public class AdminVendorController : ControllerBase
    {
        private readonly IVendorService _vendorService;

        public AdminVendorController(IVendorService vendorService)
        {
            _vendorService = vendorService;
        }

        [HttpPost]
        public async Task<ActionResult<VendorSummaryDto>> CreateVendor([FromBody] CreateVendorRequestDto request)
        {
            var result = await _vendorService.CreateAsync(request);
            if (!result.Success)
            {
                return this.ToActionResult(result);
            }

            return CreatedAtAction(nameof(GetVendorById), new { vendorId = result.Data!.VendorId }, result.Data);
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<VendorSummaryDto>>> GetVendorList()
        {
            return this.ToActionResult(await _vendorService.GetAllAsync());
        }

        [HttpGet("{vendorId:int}")]
        public async Task<ActionResult<VendorSummaryDto>> GetVendorById(int vendorId)
        {
            return this.ToActionResult(await _vendorService.GetByIdAsync(vendorId));
        }

        [HttpPut("{vendorId:int}")]
        public async Task<ActionResult<VendorSummaryDto>> UpdateVendor(int vendorId, [FromBody] UpdateVendorRequestDto request)
        {
            return this.ToActionResult(await _vendorService.UpdateAsync(vendorId, request));
        }

        [HttpDelete("{vendorId:int}")]
        public async Task<IActionResult> DeleteVendor(int vendorId)
        {
            var result = await _vendorService.DeleteAsync(vendorId);
            if (!result.Success)
            {
                return this.ToActionResult(result);
            }

            return NoContent();
        }
    }
}
