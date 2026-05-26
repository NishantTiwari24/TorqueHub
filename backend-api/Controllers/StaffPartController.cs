using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.Part;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/staff/parts")]
    [Authorize(Roles = "Admin,Staff")]
    public class StaffPartController : ControllerBase
    {
        private readonly IPartService _partService;

        public StaffPartController(IPartService partService)
        {
            _partService = partService;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<PartSummaryDto>>> GetPartList()
        {
            return this.ToActionResult(await _partService.GetAllAsync());
        }
    }
}
