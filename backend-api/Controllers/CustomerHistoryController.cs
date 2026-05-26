using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.History;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/customer")]
    [Authorize]
    public class CustomerHistoryController : ControllerBase
    {
        private readonly ICustomerHistoryService _customerHistoryService;

        public CustomerHistoryController(ICustomerHistoryService customerHistoryService)
        {
            _customerHistoryService = customerHistoryService;
        }

        [HttpGet("history")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<CustomerHistoryDto>> GetMyHistory()
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            var result = await _customerHistoryService.GetFullHistoryForUserAsync(userContext.Value.UserId, userContext.Value.Email);
            if (result is null)
            {
                return NotFound(new { success = false, message = "Customer profile not found." });
            }

            return Ok(result);
        }

        [HttpGet("purchase-history")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<CustomerHistoryDto>> GetMyPurchaseHistory()
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            var result = await _customerHistoryService.GetPurchaseHistoryForUserAsync(userContext.Value.UserId, userContext.Value.Email);
            if (result is null)
            {
                return NotFound(new { success = false, message = "Customer profile not found." });
            }

            return Ok(result);
        }

        [HttpGet("service-history")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<CustomerHistoryDto>> GetMyServiceHistory()
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            var result = await _customerHistoryService.GetServiceHistoryForUserAsync(userContext.Value.UserId, userContext.Value.Email);
            if (result is null)
            {
                return NotFound(new { success = false, message = "Customer profile not found." });
            }

            return Ok(result);
        }

        [HttpGet("/api/customers/{id:int}/history")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<CustomerHistoryDto>> GetCustomerHistory(int id)
        {
            var result = await _customerHistoryService.GetFullHistoryForCustomerAsync(id);
            if (result is null)
            {
                return NotFound(new { success = false, message = "Customer not found." });
            }

            return Ok(result);
        }

        [HttpGet("/api/customers/{id:int}/purchase-history")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<CustomerHistoryDto>> GetCustomerPurchaseHistory(int id)
        {
            var result = await _customerHistoryService.GetPurchaseHistoryForCustomerAsync(id);
            if (result is null)
            {
                return NotFound(new { success = false, message = "Customer not found." });
            }

            return Ok(result);
        }

        private (int UserId, string? Email)? GetCurrentUserContext()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return null;
            }

            return (userId, User.FindFirstValue(ClaimTypes.Email));
        }
    }
}
