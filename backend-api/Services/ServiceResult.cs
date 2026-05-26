namespace WeatherAPI.Services
{
    public enum ServiceErrorType
    {
        Validation,
        NotFound,
        Unauthorized,
        Conflict,
        Unexpected
    }

    public sealed class ServiceError
    {
        public ServiceErrorType Type { get; init; }
        public string Message { get; init; } = string.Empty;
    }

    public sealed class ServiceResult<T>
    {
        public bool Success { get; init; }
        public T? Data { get; init; }
        public ServiceError? Error { get; init; }

        public static ServiceResult<T> Ok(T data) => new()
        {
            Success = true,
            Data = data
        };

        public static ServiceResult<T> Fail(ServiceErrorType type, string message) => new()
        {
            Success = false,
            Error = new ServiceError
            {
                Type = type,
                Message = message
            }
        };
    }
}
