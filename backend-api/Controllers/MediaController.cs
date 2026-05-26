using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WeatherAPI.Models;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/media")]
    public class MediaController : ControllerBase
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp"
        };

        private const long MaxFileSizeBytes = 5 * 1024 * 1024;
        private readonly IWebHostEnvironment _environment;
        private readonly UserManager<User> _userManager;
        private readonly AppDbContext _dbContext;

        public MediaController(IWebHostEnvironment environment, UserManager<User> userManager, AppDbContext dbContext)
        {
            _environment = environment;
            _userManager = userManager;
            _dbContext = dbContext;
        }

        [HttpPost("vehicle-image")]
        [Authorize(Roles = "Admin,Staff,Customer")]
        [RequestSizeLimit(MaxFileSizeBytes)]
        public async Task<IActionResult> UploadVehicleImage([FromForm] UploadVehicleImageRequest request)
        {
            var file = request.File;
            if (file is null || file.Length == 0)
            {
                return BadRequest(new { message = "Please upload an image file." });
            }

            if (file.Length > MaxFileSizeBytes)
            {
                return BadRequest(new { message = "Image size must be 5MB or less." });
            }

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Only JPG, PNG, and WEBP files are allowed." });
            }

            var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var vehicleUploadDir = Path.Combine(webRoot, "uploads", "vehicles");
            Directory.CreateDirectory(vehicleUploadDir);

            var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var filePath = Path.Combine(vehicleUploadDir, fileName);

            await using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"{Request.Scheme}://{Request.Host}/uploads/vehicles/{fileName}";
            if (request.VehicleId.HasValue)
            {
                var vehicle = await _dbContext.Vehicles.FindAsync(request.VehicleId.Value);
                if (vehicle is not null)
                {
                    DeleteLocalUploadIfExists(vehicle.ImageUrl, "vehicles");
                    vehicle.ImageUrl = url;
                    await _dbContext.SaveChangesAsync();
                }
            }

            return Ok(new { url });
        }

        [HttpPost("profile-image")]
        [Authorize]
        [RequestSizeLimit(MaxFileSizeBytes)]
        public async Task<IActionResult> UploadProfileImage([FromForm] UploadProfileImageRequest request)
        {
            var file = request.File;
            if (file is null || file.Length == 0)
            {
                return BadRequest(new { message = "Please upload an image file." });
            }

            if (file.Length > MaxFileSizeBytes)
            {
                return BadRequest(new { message = "Image size must be 5MB or less." });
            }

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Only JPG, PNG, and WEBP files are allowed." });
            }

            var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var profileUploadDir = Path.Combine(webRoot, "uploads", "profiles");
            Directory.CreateDirectory(profileUploadDir);

            var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var filePath = Path.Combine(profileUploadDir, fileName);

            await using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"{Request.Scheme}://{Request.Host}/uploads/profiles/{fileName}";
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdValue, out var userId))
            {
                var user = await _userManager.FindByIdAsync(userId.ToString());
                if (user is not null)
                {
                    DeleteLocalUploadIfExists(user.ProfileImageUrl, "profiles");
                    user.ProfileImageUrl = url;
                    await _userManager.UpdateAsync(user);
                }
            }

            return Ok(new { url });
        }

        [HttpPost("part-image")]
        [Authorize(Roles = "Admin")]
        [RequestSizeLimit(MaxFileSizeBytes)]
        public async Task<IActionResult> UploadPartImage([FromForm] UploadPartImageRequest request)
        {
            var file = request.File;
            if (file is null || file.Length == 0)
            {
                return BadRequest(new { message = "Please upload an image file." });
            }

            if (file.Length > MaxFileSizeBytes)
            {
                return BadRequest(new { message = "Image size must be 5MB or less." });
            }

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Only JPG, PNG, and WEBP files are allowed." });
            }

            var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var partUploadDir = Path.Combine(webRoot, "uploads", "parts");
            Directory.CreateDirectory(partUploadDir);

            var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var filePath = Path.Combine(partUploadDir, fileName);

            await using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"{Request.Scheme}://{Request.Host}/uploads/parts/{fileName}";
            return Ok(new { url });
        }

        private void DeleteLocalUploadIfExists(string? currentImageUrl, string folderName)
        {
            if (string.IsNullOrWhiteSpace(currentImageUrl))
            {
                return;
            }

            if (!Uri.TryCreate(currentImageUrl, UriKind.Absolute, out var uri))
            {
                return;
            }

            var relativePath = Uri.UnescapeDataString(uri.AbsolutePath);
            var expectedPrefix = $"/uploads/{folderName}/";
            if (!relativePath.StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var fileName = Path.GetFileName(relativePath);
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return;
            }

            var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var previousFilePath = Path.Combine(webRoot, "uploads", folderName, fileName);

            if (System.IO.File.Exists(previousFilePath))
            {
                System.IO.File.Delete(previousFilePath);
            }
        }

        public class UploadVehicleImageRequest
        {
            public IFormFile? File { get; set; }
            public int? VehicleId { get; set; }
        }

        public class UploadProfileImageRequest
        {
            public IFormFile? File { get; set; }
        }

        public class UploadPartImageRequest
        {
            public IFormFile? File { get; set; }
        }
    }
}
