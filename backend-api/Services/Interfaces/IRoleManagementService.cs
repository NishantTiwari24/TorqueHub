namespace WeatherAPI.Services.Interfaces
{
    public interface IRoleManagementService
    {
        Task<ServiceResult<IReadOnlyList<string>>> GetRolesAsync(int staffId, int adminUserId);
        Task<ServiceResult<IReadOnlyList<string>>> AssignRolesAsync(int staffId, IReadOnlyCollection<string> roles, int adminUserId);
        Task<ServiceResult<IReadOnlyList<string>>> RevokeRoleAsync(int staffId, string role, int adminUserId);
    }
}
