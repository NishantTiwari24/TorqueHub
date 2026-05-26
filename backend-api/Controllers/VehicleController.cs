using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/vehicles")]
    [Authorize]
    public class VehicleController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public VehicleController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // POST: api/vehicles
        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> AddVehicle([FromBody] UpsertVehicleRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId is null)
            {
                return Unauthorized(new { message = "Invalid token." });
            }

            var normalizedPlate = request.VehicleNumber.Trim().ToUpperInvariant();
            var plateExists = await _dbContext.Vehicles.AnyAsync(v => v.VehicleNumber == normalizedPlate);
            if (plateExists)
            {
                return BadRequest(new { message = "Vehicle number already exists." });
            }

            var vehicle = new Vehicle
            {
                UserId = userId.Value,
                VehicleNumber = normalizedPlate,
                Model = request.Model.Trim(),
                Brand = request.Brand.Trim(),
                Category = request.Category.Trim(),
                Year = request.Year,
                ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim()
            };

            _dbContext.Vehicles.Add(vehicle);
            await _dbContext.SaveChangesAsync();
            return Ok(ToVehicleResponse(vehicle));
        }

        // GET: api/vehicles/my
        [HttpGet("my")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyVehicles()
        {
            var userId = GetCurrentUserId();
            if (userId is null)
            {
                return Unauthorized(new { message = "Invalid token." });
            }

            var vehicles = await _dbContext.Vehicles
                .Where(v => v.UserId == userId.Value)
                .OrderByDescending(v => v.VehicleId)
                .Select(v => ToVehicleResponse(v))
                .ToListAsync();
            return Ok(vehicles);
        }

        // GET: api/vehicles/user/{userId}
        [HttpGet("user/{userId}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetVehiclesByUser(int userId)
        {
            var vehicles = await _dbContext.Vehicles
                .Where(v => v.UserId == userId)
                .Select(v => ToVehicleResponse(v))
                .ToListAsync();
            return Ok(vehicles);
        }

        // PUT: api/vehicles/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> UpdateVehicle(int id, [FromBody] UpsertVehicleRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId is null)
            {
                return Unauthorized(new { message = "Invalid token." });
            }

            var vehicle = await _dbContext.Vehicles.FindAsync(id);
            if (vehicle == null) return NotFound();
            if (vehicle.UserId != userId.Value)
            {
                return Forbid();
            }

            var normalizedPlate = request.VehicleNumber.Trim().ToUpperInvariant();
            var plateExists = await _dbContext.Vehicles.AnyAsync(v => v.VehicleId != id && v.VehicleNumber == normalizedPlate);
            if (plateExists)
            {
                return BadRequest(new { message = "Vehicle number already exists." });
            }

            vehicle.VehicleNumber = normalizedPlate;
            vehicle.Model = request.Model.Trim();
            vehicle.Brand = request.Brand.Trim();
            vehicle.Category = request.Category.Trim();
            vehicle.Year = request.Year;
            vehicle.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();

            await _dbContext.SaveChangesAsync();
            return Ok(ToVehicleResponse(vehicle));
        }

        // DELETE: api/vehicles/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            var userId = GetCurrentUserId();
            if (userId is null)
            {
                return Unauthorized(new { message = "Invalid token." });
            }

            var vehicle = await _dbContext.Vehicles.FindAsync(id);
            if (vehicle == null) return NotFound();
            if (vehicle.UserId != userId.Value)
            {
                return Forbid();
            }

            _dbContext.Vehicles.Remove(vehicle);
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        private static object ToVehicleResponse(Vehicle vehicle) => new
        {
            vehicle.VehicleId,
            vehicle.VehicleNumber,
            vehicle.Model,
            vehicle.Brand,
            vehicle.Category,
            vehicle.Year,
            vehicle.ImageUrl,
            vehicle.UserId
        };

        public class UpsertVehicleRequest
        {
            public string VehicleNumber { get; set; } = string.Empty;
            public string Model { get; set; } = string.Empty;
            public string Brand { get; set; } = string.Empty;
            public string Category { get; set; } = string.Empty;
            public int Year { get; set; }
            public string? ImageUrl { get; set; }
        }
    }
}
