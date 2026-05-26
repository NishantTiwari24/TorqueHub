using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WeatherAPI.Controllers
{
    [ApiController]
    [Route("api/customers")]
    [Authorize(Roles = "Admin,Staff")]
    public class CustomersController : ControllerBase
    {
    }
}
