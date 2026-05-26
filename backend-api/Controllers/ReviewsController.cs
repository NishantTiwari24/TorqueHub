using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherAPI.DTOs.Reviews;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/reviews")]
    [Authorize]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ReviewSummaryDto>> CreateReview([FromBody] CreateReviewRequestDto request)
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            var result = await _reviewService.CreateAsync(userContext.Value.UserId, userContext.Value.Email, request);
            if (!result.Success)
            {
                return this.ToActionResult(result);
            }

            return Created($"/api/reviews/{result.Data!.ReviewId}", result.Data);
        }

        [HttpGet("my")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<IReadOnlyList<ReviewSummaryDto>>> GetMyReviews()
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            return this.ToActionResult(await _reviewService.GetForUserAsync(userContext.Value.UserId, userContext.Value.Email));
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ReviewSummaryDto>> UpdateReview(int id, [FromBody] UpdateReviewRequestDto request)
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            return this.ToActionResult(await _reviewService.UpdateAsync(id, userContext.Value.UserId, userContext.Value.Email, request));
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var userContext = GetCurrentUserContext();
            if (userContext is null)
            {
                return Unauthorized(new { success = false, message = "Invalid token." });
            }

            var result = await _reviewService.DeleteAsync(id, userContext.Value.UserId, userContext.Value.Email);
            if (!result.Success)
            {
                return this.ToActionResult(result);
            }

            return NoContent();
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<ReviewSummaryDto>>> GetReviews()
        {
            return this.ToActionResult(await _reviewService.GetAllAsync());
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
