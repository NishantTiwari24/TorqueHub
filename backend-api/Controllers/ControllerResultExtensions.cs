using Microsoft.AspNetCore.Mvc;
using WeatherAPI.Services;

namespace WeatherAPI.Controllers
{
    public static class ControllerResultExtensions
    {
        public static IActionResult ToActionResult(this ControllerBase controller, ServiceResult<bool> result)
        {
            if (result.Success)
            {
                return controller.Ok(new { success = true });
            }

            var message = result.Error?.Message ?? "Request failed.";
            return result.Error?.Type switch
            {
                ServiceErrorType.Validation => controller.BadRequest(new { success = false, message }),
                ServiceErrorType.NotFound => controller.NotFound(new { success = false, message }),
                ServiceErrorType.Unauthorized => controller.Unauthorized(new { success = false, message }),
                ServiceErrorType.Conflict => controller.Conflict(new { success = false, message }),
                _ => controller.StatusCode(500, new { success = false, message })
            };
        }

        public static ActionResult<T> ToActionResult<T>(this ControllerBase controller, ServiceResult<T> result)
        {
            if (result.Success)
            {
                return controller.Ok(result.Data);
            }

            var message = result.Error?.Message ?? "Request failed.";
            return result.Error?.Type switch
            {
                ServiceErrorType.Validation => controller.BadRequest(new { success = false, message }),
                ServiceErrorType.NotFound => controller.NotFound(new { success = false, message }),
                ServiceErrorType.Unauthorized => controller.Unauthorized(new { success = false, message }),
                ServiceErrorType.Conflict => controller.Conflict(new { success = false, message }),
                _ => controller.StatusCode(500, new { success = false, message })
            };
        }
    }
}
