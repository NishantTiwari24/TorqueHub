using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Security.Claims;
using System.Security.Cryptography;
using WeatherAPI.DTOs.Auth;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/customers")]
    [Authorize(Roles = "Admin,Staff,Customer")]
    public class CustomerManagementController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly AppDbContext _dbContext;
        private readonly IEmailService _emailService;
        private readonly ILogger<CustomerManagementController> _logger;

        public CustomerManagementController(
            UserManager<User> userManager,
            AppDbContext dbContext,
            IEmailService emailService,
            ILogger<CustomerManagementController> logger)
        {
            _userManager = userManager;
            _dbContext = dbContext;
            _emailService = emailService;
            _logger = logger;
        }

        // Staff registers new customer with vehicle
        [HttpPost("register-with-vehicle")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> RegisterCustomerWithVehicle([FromBody] RegisterCustomerWithVehicleDto dto)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var temporaryPassword = "Customer123";
                var customerName = dto.Name.Trim();
                var email = dto.Email.Trim();
                var phoneNumber = dto.PhoneNumber.Trim();
                var brand = dto.Brand.Trim();
                var model = dto.Model.Trim();
                var category = dto.Category.Trim();
                var vehicleNumber = dto.VehicleNumber.Trim();
                var normalizedVehicleNumber = vehicleNumber.ToUpperInvariant();
                var currentYear = DateTime.UtcNow.Year;

                if (dto.Year > currentYear)
                {
                    return BadRequest(new { message = $"Vehicle year cannot be in the future. Use a year up to {currentYear}." });
                }

                var existingUser = await _userManager.FindByEmailAsync(email);
                if (existingUser != null)
                {
                    return BadRequest(new { message = "A customer with this email already exists." });
                }

                var existingVehicle = await _dbContext.Vehicles
                    .AnyAsync(v => v.VehicleNumber == normalizedVehicleNumber || v.VehicleNumber.ToUpper() == normalizedVehicleNumber);
                if (existingVehicle)
                {
                    return BadRequest(new { message = "Vehicle number already exists." });
                }

                var user = new User { UserName = email, Email = email, PhoneNumber = phoneNumber, Name = customerName, EmailConfirmed = true, IsActive = true };
                var result = await _userManager.CreateAsync(user, temporaryPassword);
                if (!result.Succeeded)
                {
                    var message = result.Errors.FirstOrDefault()?.Description ?? "Unable to create customer.";
                    return BadRequest(new { message });
                }

                var roleResult = await _userManager.AddToRoleAsync(user, "Customer");
                if (!roleResult.Succeeded)
                {
                    var message = roleResult.Errors.FirstOrDefault()?.Description ?? "Unable to assign Customer role.";
                    return BadRequest(new { message });
                }

                var vehicle = new Vehicle {
                    UserId = user.Id,
                    VehicleNumber = normalizedVehicleNumber,
                    Model = model,
                    Brand = brand,
                    Category = category,
                    Year = dto.Year,
                    ImageUrl = string.IsNullOrWhiteSpace(dto.VehicleImageUrl) ? null : dto.VehicleImageUrl.Trim()
                };

                try
                {
                    _dbContext.Vehicles.Add(vehicle);
                    var savedEntries = await _dbContext.SaveChangesAsync();
                    if (savedEntries <= 0 || vehicle.VehicleId <= 0)
                    {
                        throw new InvalidOperationException("Vehicle registration did not persist.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Vehicle registration failed for user {UserId}. Rolling back customer creation.", user.Id);
                    await SafeDeleteCustomerAsync(user);
                    var detail = ex is DbUpdateException dbUpdateEx && dbUpdateEx.InnerException != null
                        ? dbUpdateEx.InnerException.Message
                        : ex.Message;
                    return StatusCode(StatusCodes.Status500InternalServerError, new
                    {
                        message = "Customer was created but vehicle registration failed. Operation was rolled back.",
                        error = detail,
                        traceId = HttpContext.TraceIdentifier
                    });
                }

                await SendTemporaryPasswordEmailAsync(user, temporaryPassword);

                return Ok(new
                {
                    user.Id,
                    user.Email,
                    user.Name,
                    user.PhoneNumber,
                    TemporaryPasswordIssued = true,
                    vehicle = new
                    {
                        vehicle.VehicleId,
                        vehicle.VehicleNumber,
                        vehicle.Brand,
                        vehicle.Model,
                        vehicle.Category,
                        vehicle.Year,
                        vehicle.ImageUrl
                    }
                });
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx && pgEx.ConstraintName == "IX_Vehicles_VehicleNumber")
            {
                return BadRequest(new { message = "Vehicle number already exists." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while registering customer with vehicle.");
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Unable to register customer right now.",
                    error = ex.Message,
                    traceId = HttpContext.TraceIdentifier
                });
            }
        }

        private async Task SafeDeleteCustomerAsync(User user)
        {
            try
            {
                await _userManager.RemoveFromRoleAsync(user, "Customer");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed removing role during rollback for user {UserId}.", user.Id);
            }

            try
            {
                await _userManager.DeleteAsync(user);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed deleting user during rollback for user {UserId}.", user.Id);
            }
        }

        // Staff/Admin views customer details, vehicles, and history
        [HttpGet("{userId}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetCustomerDetails(int userId)
        {
            try
            {
                var user = await _userManager.Users
                    .Where(u => u.Id == userId)
                    .Select(h => new
                    {
                        h.Id,
                        h.Name,
                        h.UserName,
                        h.Email,
                        h.PhoneNumber,
                        h.CreatedAtUtc
                    })
                    .FirstOrDefaultAsync();
                if (user == null) return NotFound();

                var vehicles = await _dbContext.Vehicles
                    .Where(v => v.UserId == userId)
                    .Select(v => new
                    {
                        v.VehicleId,
                        v.VehicleNumber,
                        v.Brand,
                        v.Model,
                        v.Category,
                        v.Year,
                        v.ImageUrl
                    })
                    .ToListAsync();

                List<object> history;
                try
                {
                    history = await _dbContext.ServiceHistories
                        .Where(h => h.UserId == userId)
                        .Select(h => new
                        {
                            h.ServiceHistoryId,
                            h.HistoryType,
                            h.Description,
                            h.ReferenceNumber,
                            h.EventDateUtc,
                            h.Amount
                        })
                        .Cast<object>()
                        .ToListAsync();
                }
                catch (PostgresException pgEx) when (pgEx.SqlState == "42P01")
                {
                    _logger.LogWarning(pgEx, "ServiceHistories table is missing in GetCustomerDetails. Returning empty history.");
                    history = new List<object>();
                }

                return Ok(new { user, vehicles, history });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while loading customer details for user {UserId}.", userId);
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Failed to load customer details.",
                    error = ex.Message,
                    traceId = HttpContext.TraceIdentifier
                });
            }
        }

        // Search customers by vehicle number, phone, ID, or name
        [HttpGet("search")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> SearchCustomers([FromQuery] string? vehicleNumber, [FromQuery] string? phone, [FromQuery] int? id, [FromQuery] string? name, [FromQuery] string? email, [FromQuery] string? query)
        {
            try
            {
                var customerRoleId = await _dbContext.Roles
                    .Where(r => r.NormalizedName == "CUSTOMER")
                    .Select(r => r.Id)
                    .FirstOrDefaultAsync();

                IQueryable<User> usersQuery = _userManager.Users.AsNoTracking();
                if (customerRoleId != 0)
                {
                    usersQuery = usersQuery.Where(u =>
                        _dbContext.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == customerRoleId));
                }
                else
                {
                    usersQuery = usersQuery.Where(u => _dbContext.Vehicles.Any(v => v.UserId == u.Id));
                }

                if (!string.IsNullOrWhiteSpace(query))
                {
                    var q = query.Trim();
                    var upperQ = q.ToUpperInvariant();
                    if (int.TryParse(q, out var parsedId))
                    {
                        usersQuery = usersQuery.Where(u =>
                            u.Id == parsedId ||
                            (u.PhoneNumber != null && u.PhoneNumber.Contains(q)) ||
                            _dbContext.Vehicles.Any(v => v.UserId == u.Id && v.VehicleNumber.ToUpper().Contains(upperQ)));
                    }
                    else
                    {
                        usersQuery = usersQuery.Where(u =>
                            (u.Name != null && EF.Functions.ILike(u.Name, $"%{q}%")) ||
                            (u.UserName != null && EF.Functions.ILike(u.UserName, $"%{q}%")) ||
                            (u.Email != null && EF.Functions.ILike(u.Email, $"%{q}%")) ||
                            (u.PhoneNumber != null && u.PhoneNumber.Contains(q)) ||
                            _dbContext.Vehicles.Any(v => v.UserId == u.Id && v.VehicleNumber.ToUpper().Contains(upperQ)));
                    }
                }
                else
                {
                    if (!string.IsNullOrWhiteSpace(vehicleNumber))
                    {
                        var plate = vehicleNumber.Trim().ToUpperInvariant();
                        usersQuery = usersQuery.Where(u =>
                            _dbContext.Vehicles.Any(v => v.UserId == u.Id && v.VehicleNumber.ToUpper().Contains(plate)));
                    }

                    if (!string.IsNullOrWhiteSpace(phone))
                    {
                        var normalizedPhone = phone.Trim();
                        usersQuery = usersQuery.Where(u => u.PhoneNumber != null && u.PhoneNumber.Contains(normalizedPhone));
                    }

                    if (id.HasValue)
                    {
                        usersQuery = usersQuery.Where(u => u.Id == id.Value);
                    }

                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        var normalizedEmail = email.Trim();
                        usersQuery = usersQuery.Where(u => u.Email != null && EF.Functions.ILike(u.Email, $"%{normalizedEmail}%"));
                    }

                    if (!string.IsNullOrWhiteSpace(name))
                    {
                        var normalizedName = name.Trim();
                        usersQuery = usersQuery.Where(u =>
                            (u.Name != null && EF.Functions.ILike(u.Name, $"%{normalizedName}%")) ||
                            (u.UserName != null && EF.Functions.ILike(u.UserName, $"%{normalizedName}%")) ||
                            (u.Email != null && EF.Functions.ILike(u.Email, $"%{normalizedName}%")));
                    }
                }

                var userList = await usersQuery
                    .OrderBy(u => u.Name)
                    .ThenBy(u => u.Id)
                    .ToListAsync();

                if (userList.Count == 0)
                {
                    return Ok(Array.Empty<object>());
                }

                var resultUserIds = userList.Select(u => u.Id).ToList();

                var vehicleCounts = await _dbContext.Vehicles
                    .Where(v => v.UserId.HasValue && resultUserIds.Contains(v.UserId.Value))
                    .GroupBy(v => v.UserId!.Value)
                    .Select(g => new { UserId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.UserId, x => x.Count);

                Dictionary<int, int> historyCounts;
                try
                {
                    historyCounts = await _dbContext.ServiceHistories
                        .Where(h => resultUserIds.Contains(h.UserId))
                        .GroupBy(h => h.UserId)
                        .Select(g => new { UserId = g.Key, Count = g.Count() })
                        .ToDictionaryAsync(x => x.UserId, x => x.Count);
                }
                catch (PostgresException pgEx) when (pgEx.SqlState == "42P01")
                {
                    _logger.LogWarning(pgEx, "ServiceHistories table is missing. Returning history count as zero.");
                    historyCounts = new Dictionary<int, int>();
                }

                var customers = userList.Select(user => new
                {
                    user.Id,
                    user.Name,
                    user.UserName,
                    user.Email,
                    user.PhoneNumber,
                    user.ProfileImageUrl,
                    VehicleCount = vehicleCounts.TryGetValue(user.Id, out var vc) ? vc : 0,
                    HistoryCount = historyCounts.TryGetValue(user.Id, out var hc) ? hc : 0
                });

                return Ok(customers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while searching customers.");
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Failed to load customers.",
                    error = ex.Message,
                    traceId = HttpContext.TraceIdentifier
                });
            }
        }

        // Legacy endpoint kept for backward compatibility, but now secured to self-only updates.
        [HttpPut("update-profile/{userId}")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UpdateProfileDto dto)
        {
            var currentUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(currentUserIdClaim, out var currentUserId))
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            if (currentUserId != userId)
            {
                return Forbid();
            }

            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();
            user.UserName = dto.UserName;
            user.PhoneNumber = dto.PhoneNumber;
            await _userManager.UpdateAsync(user);
            return Ok(new
            {
                user.Id,
                user.UserName,
                user.PhoneNumber
            });
        }

        [HttpPatch("me")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> PatchMyProfile([FromBody] UpdateProfileDto dto)
        {
            var currentUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(currentUserIdClaim, out var currentUserId))
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);
            if (user is null)
            {
                return NotFound(new { success = false, message = "Customer profile not found." });
            }

            user.UserName = dto.UserName.Trim();
            user.PhoneNumber = dto.PhoneNumber.Trim();
            await _userManager.UpdateAsync(user);
            return Ok(new
            {
                user.Id,
                user.UserName,
                user.PhoneNumber
            });
        }

        private async Task SendTemporaryPasswordEmailAsync(User customer, string temporaryPassword)
        {
            try
            {
                await _emailService.SendSystemEmailAsync(
                    customer.Id,
                    customer.Id,
                    customer.Email ?? string.Empty,
                    "TorqueHub account created",
                    $"Hello {customer.Name},\n\nYour account has been created by staff.\nTemporary password: {temporaryPassword}\nPlease sign in and change your password immediately.\n\nThanks,\nTorqueHub",
                    "AccountOnboarding",
                    $"WELCOME-{customer.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed sending temporary password email for customer {UserId}.", customer.Id);
            }
        }

        private static string GenerateTemporaryPassword()
        {
            const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
            const string lower = "abcdefghijkmnopqrstuvwxyz";
            const string digits = "23456789";
            var all = upper + lower + digits;

            Span<char> password = stackalloc char[12];
            password[0] = upper[RandomNumberGenerator.GetInt32(upper.Length)];
            password[1] = lower[RandomNumberGenerator.GetInt32(lower.Length)];
            password[2] = digits[RandomNumberGenerator.GetInt32(digits.Length)];

            for (var i = 3; i < password.Length; i++)
            {
                password[i] = all[RandomNumberGenerator.GetInt32(all.Length)];
            }

            // Fisher-Yates shuffle
            for (var i = password.Length - 1; i > 0; i--)
            {
                var j = RandomNumberGenerator.GetInt32(i + 1);
                (password[i], password[j]) = (password[j], password[i]);
            }

            return new string(password);
        }
    }

    // DTOs for requests
    public class UpdateProfileDto
    {
        public string UserName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
