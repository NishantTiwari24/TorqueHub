# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY backend-api/WeatherAPI.csproj backend-api/
RUN dotnet restore backend-api/WeatherAPI.csproj

# Copy the rest of the source code
COPY . ./

# Publish the app
RUN dotnet publish backend-api/WeatherAPI.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# ASP.NET Core listens on port 8080 by default in modern .NET containers
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "WeatherAPI.dll"]
