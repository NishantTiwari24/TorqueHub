using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.Part;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/parts")]
    public class PartsController : ControllerBase
    {
        private readonly IPartService _partService;

        public PartsController(IPartService partService)
        {
            _partService = partService;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<PartSummaryDto>>> GetPartList()
        {
            var result = await _partService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{partId:int}")]
        public async Task<ActionResult<PartSummaryDto>> GetPartById(int partId)
        {
            var result = await _partService.GetByIdAsync(partId);
            if (result is null)
            {
                return NotFound(new { success = false, message = "Part not found." });
            }

            return Ok(result);
        }
    }
}
