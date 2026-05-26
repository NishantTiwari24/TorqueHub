using Microsoft.AspNetCore.Identity;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class RoleManagementService : IRoleManagementService
    {
        private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase) { "Staff", "Customer", "Admin" };
        private readonly UserManager<User> _userManager;
        private readonly ILogger<RoleManagementService> _logger;

        public RoleManagementService(UserManager<User> userManager, ILogger<RoleManagementService> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<ServiceResult<IReadOnlyList<string>>> GetRolesAsync(int staffId, int adminUserId)
        {
            var user = await _userManager.FindByIdAsync(staffId.ToString());
            if (user is null)
            {
                return ServiceResult<IReadOnlyList<string>>.Fail(ServiceErrorType.NotFound, "Staff user not found.");
            }

            var roles = (await _userManager.GetRolesAsync(user)).ToList();
            _logger.LogInformation("Admin {AdminUserId} fetched roles for user {UserId}.", adminUserId, staffId);
            return ServiceResult<IReadOnlyList<string>>.Ok(roles);
        }

        public async Task<ServiceResult<IReadOnlyList<string>>> AssignRolesAsync(int staffId, IReadOnlyCollection<string> roles, int adminUserId)
        {
            var user = await _userManager.FindByIdAsync(staffId.ToString());
            if (user is null)
            {
                return ServiceResult<IReadOnlyList<string>>.Fail(ServiceErrorType.NotFound, "Staff user not found.");
            }

            var normalizedRoles = roles
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => r.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (normalizedRoles.Count == 0)
            {
                return ServiceResult<IReadOnlyList<string>>.Fail(ServiceErrorType.Validation, "At least one role is required.");
            }

            if (normalizedRoles.Any(r => !AllowedRoles.Contains(r)))
            {
                return ServiceResult<IReadOnlyList<string>>.Fail(ServiceErrorType.Validation, "One or more roles are invalid.");
            }

            foreach (var role in normalizedRoles)
            {
                var addResult = await _userManager.AddToRoleAsync(user, role);
                if (!addResult.Succeeded)
                {
                    var message = addResult.Errors.FirstOrDefault()?.Description ?? $"Unable to assign role {role}.";
                    return ServiceResult<IReadOnlyList<string>>.Fail(ServiceErrorType.Validation, message);
                }
            }

            var currentRoles = (await _userManager.GetRolesAsync(user)).ToList();
            _logger.LogInformation("Admin {AdminUserId} assigned roles [{Roles}] to user {UserId}.",
                adminUserId, string.Join(", ", normalizedRoles), staffId);
            return ServiceResult<IReadOnlyList<string>>.Ok(currentRoles);
        }

        public async Task<ServiceResult<IReadOnlyList<string>>> RevokeRoleAsync(int staffId, string role, int adminUserId)
        {
            var user = await _userManager.FindByIdAsync(staffId.ToString());
            if (user is null)
            {
                return ServiceResult<IReadOnlyList<string>>.Fail(ServiceErrorType.NotFound, "Staff user not found.");
            }

            var normalizedRole = role.Trim();
            if (!AllowedRoles.Contains(normalizedRole))
            {
                return ServiceResult<IReadOnlyList<string>>.Fail(ServiceErrorType.Validation, "Invalid role.");
            }

            if (!await _userManager.IsInRoleAsync(user, normalizedRole))
            {
                return ServiceResult<IReadOnlyList<string>>.Fail(ServiceErrorType.NotFound, $"User does not have role {normalizedRole}.");
            }

            var removeResult = await _userManager.RemoveFromRoleAsync(user, normalizedRole);
            if (!removeResult.Succeeded)
            {
                var message = removeResult.Errors.FirstOrDefault()?.Description ?? $"Unable to revoke role {normalizedRole}.";
                return ServiceResult<IReadOnlyList<string>>.Fail(ServiceErrorType.Validation, message);
            }

            var currentRoles = (await _userManager.GetRolesAsync(user)).ToList();
            _logger.LogInformation("Admin {AdminUserId} revoked role {Role} from user {UserId}.", adminUserId, normalizedRole, staffId);
            return ServiceResult<IReadOnlyList<string>>.Ok(currentRoles);
        }
    }
}
