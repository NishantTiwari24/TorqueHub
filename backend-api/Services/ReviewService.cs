using Microsoft.EntityFrameworkCore;
using WeatherAPI.DTOs.Reviews;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class ReviewService : IReviewService
    {
        private readonly AppDbContext _dbContext;
        private readonly ILogger<ReviewService> _logger;

        public ReviewService(AppDbContext dbContext, ILogger<ReviewService> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task<ServiceResult<ReviewSummaryDto>> CreateAsync(int userId, string? userEmail, CreateReviewRequestDto request)
        {
            var appointment = await _dbContext.Appointments
                .Include(a => a.Vehicle)
                .FirstOrDefaultAsync(a => a.AppointmentId == request.AppointmentId);

            if (appointment is null)
            {
                return ServiceResult<ReviewSummaryDto>.Fail(ServiceErrorType.NotFound, "Appointment not found.");
            }

            if (!BelongsToUser(appointment, userId))
            {
                return ServiceResult<ReviewSummaryDto>.Fail(ServiceErrorType.Unauthorized, "You can only review your own appointment.");
            }

            if (appointment.Status != AppointmentStatus.Completed)
            {
                return ServiceResult<ReviewSummaryDto>.Fail(ServiceErrorType.Validation, "Only completed appointments can be reviewed.");
            }

            var alreadyReviewed = await _dbContext.Reviews.AnyAsync(r => r.UserId == userId && r.AppointmentId == appointment.AppointmentId);
            if (alreadyReviewed)
            {
                return ServiceResult<ReviewSummaryDto>.Fail(ServiceErrorType.Conflict, "This appointment already has a review.");
            }

            var review = new Review
            {
                UserId = userId,
                AppointmentId = appointment.AppointmentId,
                Rating = request.Rating,
                Comment = request.Comment.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };

            _dbContext.Reviews.Add(review);
            await _dbContext.SaveChangesAsync();

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
            _logger.LogInformation("Review created: {ReviewId}", review.ReviewId);
            return ServiceResult<ReviewSummaryDto>.Ok(MapToSummary(review, user));
        }

        public async Task<ServiceResult<IReadOnlyList<ReviewSummaryDto>>> GetForUserAsync(int userId, string? userEmail)
        {
            var data = await BuildSummaryQuery().Where(r => r.UserId == userId).OrderByDescending(r => r.CreatedAtUtc).ToListAsync();
            return ServiceResult<IReadOnlyList<ReviewSummaryDto>>.Ok(data);
        }

        public async Task<ServiceResult<IReadOnlyList<ReviewSummaryDto>>> GetAllAsync()
        {
            var data = await BuildSummaryQuery().OrderByDescending(r => r.CreatedAtUtc).ToListAsync();
            return ServiceResult<IReadOnlyList<ReviewSummaryDto>>.Ok(data);
        }

        public async Task<ServiceResult<ReviewSummaryDto>> UpdateAsync(int reviewId, int userId, string? userEmail, UpdateReviewRequestDto request)
        {
            var review = await _dbContext.Reviews.Include(r => r.User).FirstOrDefaultAsync(r => r.ReviewId == reviewId && r.UserId == userId);
            if (review is null)
            {
                return ServiceResult<ReviewSummaryDto>.Fail(ServiceErrorType.NotFound, "Review not found.");
            }

            review.Rating = request.Rating;
            review.Comment = request.Comment.Trim();
            review.UpdatedAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            return ServiceResult<ReviewSummaryDto>.Ok(MapToSummary(review, review.User));
        }

        public async Task<ServiceResult<bool>> DeleteAsync(int reviewId, int userId, string? userEmail)
        {
            var review = await _dbContext.Reviews.FirstOrDefaultAsync(r => r.ReviewId == reviewId && r.UserId == userId);
            if (review is null)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.NotFound, "Review not found.");
            }

            _dbContext.Reviews.Remove(review);
            await _dbContext.SaveChangesAsync();
            return ServiceResult<bool>.Ok(true);
        }

        private IQueryable<ReviewSummaryDto> BuildSummaryQuery()
        {
            return _dbContext.Reviews.AsNoTracking().Include(r => r.User).Select(r => new ReviewSummaryDto
            {
                ReviewId = r.ReviewId,
                UserId = r.UserId,
                CustomerId = r.UserId,
                CustomerName = r.User.Name,
                AppointmentId = r.AppointmentId,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAtUtc = r.CreatedAtUtc,
                UpdatedAtUtc = r.UpdatedAtUtc
            });
        }

        private static bool BelongsToUser(Appointment appointment, int userId) => appointment.UserId == userId;

        private static ReviewSummaryDto MapToSummary(Review review, User? user)
        {
            return new ReviewSummaryDto
            {
                ReviewId = review.ReviewId,
                UserId = review.UserId,
                CustomerId = review.UserId,
                CustomerName = user?.Name ?? "Customer",
                AppointmentId = review.AppointmentId,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAtUtc = review.CreatedAtUtc,
                UpdatedAtUtc = review.UpdatedAtUtc
            };
        }
    }
}
