using Microsoft.EntityFrameworkCore;
using WeatherAPI.DTOs.Part;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class PartService : IPartService
    {
        private const string StockTransactionTypeOpening = "OpeningStock";
        private readonly AppDbContext _dbContext;
        private readonly IWebHostEnvironment _environment;
        private readonly INotificationService _notificationService;
        private readonly ILogger<PartService> _logger;

        public PartService(AppDbContext dbContext, IWebHostEnvironment environment, INotificationService notificationService, ILogger<PartService> logger)
        {
            _dbContext = dbContext;
            _environment = environment;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<ServiceResult<PartSummaryDto>> CreateAsync(CreatePartRequestDto request)
        {
            var vendor = await _dbContext.Vendors.FirstOrDefaultAsync(v => v.VendorId == request.VendorId);
            if (vendor is null)
            {
                return ServiceResult<PartSummaryDto>.Fail(ServiceErrorType.NotFound, "Vendor not found.");
            }

            var imageResult = NormalizeAndValidateImageUrls(request.ImageUrls);
            if (!imageResult.Success)
            {
                return ServiceResult<PartSummaryDto>.Fail(imageResult.Error!.Type, imageResult.Error.Message);
            }

            var conditionResult = NormalizeAndValidateCondition(request.Condition);
            if (!conditionResult.Success)
            {
                return ServiceResult<PartSummaryDto>.Fail(conditionResult.Error!.Type, conditionResult.Error.Message);
            }

            var openingInvoiceNumber = request.OpeningInvoiceNumber.Trim();
            if (string.IsNullOrWhiteSpace(openingInvoiceNumber))
            {
                return ServiceResult<PartSummaryDto>.Fail(ServiceErrorType.Validation, "Invoice number is required.");
            }

            var duplicateOpeningReferenceExists = await _dbContext.StockTransactions
                .AsNoTracking()
                .AnyAsync(st => st.ReferenceNumber == openingInvoiceNumber);
            if (duplicateOpeningReferenceExists)
            {
                return ServiceResult<PartSummaryDto>.Fail(ServiceErrorType.Conflict, "Invoice number already exists.");
            }

            var duplicatePurchaseInvoiceExists = await _dbContext.PurchaseInvoices
                .AsNoTracking()
                .AnyAsync(pi => pi.InvoiceNumber == openingInvoiceNumber);
            if (duplicatePurchaseInvoiceExists)
            {
                return ServiceResult<PartSummaryDto>.Fail(ServiceErrorType.Conflict, "Invoice number already exists.");
            }

            var part = new VehiclePart
            {
                Name = request.Name.Trim(),
                Descriptions = request.Descriptions.Trim(),
                Category = request.Category.Trim(),
                Condition = conditionResult.Data!,
                Price = request.Price,
                StockQuantity = request.StockQuantity,
                VendorId = request.VendorId,
                PartImages = imageResult.Data!
                    .Select(url => new VehiclePartImage { ImageUrl = url })
                    .ToList()
            };

            _dbContext.VehicleParts.Add(part);
            await _dbContext.SaveChangesAsync();

            if (part.StockQuantity > 0)
            {
                var lineTotal = part.Price * part.StockQuantity;
                var openingInvoice = new PurchaseInvoice
                {
                    InvoiceNumber = openingInvoiceNumber,
                    VendorId = part.VendorId,
                    InvoiceDate = DateTime.UtcNow.Date,
                    Notes = "Opening stock recorded during part creation.",
                    TotalAmount = lineTotal,
                    CreatedAtUtc = DateTime.UtcNow,
                    Items = new List<PurchaseInvoiceItem>
                    {
                        new()
                        {
                            PartId = part.PartId,
                            Quantity = part.StockQuantity,
                            UnitCost = part.Price,
                            LineTotal = lineTotal
                        }
                    }
                };
                _dbContext.PurchaseInvoices.Add(openingInvoice);

                _dbContext.StockTransactions.Add(new StockTransaction
                {
                    PartId = part.PartId,
                    QuantityChange = part.StockQuantity,
                    QuantityBefore = 0,
                    QuantityAfter = part.StockQuantity,
                    TransactionType = StockTransactionTypeOpening,
                    ReferenceNumber = openingInvoiceNumber,
                    SalesInvoiceId = null,
                    CreatedAtUtc = DateTime.UtcNow
                });

                await _dbContext.SaveChangesAsync();
                await TryCreateLowStockNotificationsAsync(openingInvoiceNumber);
            }

            _logger.LogInformation("Part created: {PartId}", part.PartId);
            return ServiceResult<PartSummaryDto>.Ok(MapToSummary(part, vendor.Name, vendor.Email));
        }

        public async Task<ServiceResult<IReadOnlyList<PartSummaryDto>>> GetAllAsync()
        {
            var data = await _dbContext.VehicleParts
                .AsNoTracking()
                .Where(p => !p.IsDeleted)
                .Include(p => p.Vendor)
                .Include(p => p.PartImages)
                .OrderBy(p => p.Name)
                .Select(p => new PartSummaryDto
                {
                    PartId = p.PartId,
                    Name = p.Name,
                    Descriptions = p.Descriptions,
                    Category = p.Category,
                    Condition = p.Condition,
                    Price = p.Price,
                    StockQuantity = p.StockQuantity,
                    VendorId = p.VendorId,
                    VendorName = p.Vendor.Name,
                    VendorEmail = p.Vendor.Email,
                    ImageUrls = p.PartImages.OrderBy(pi => pi.ImageId).Select(pi => pi.ImageUrl).ToList()
                })
                .ToListAsync();

            return ServiceResult<IReadOnlyList<PartSummaryDto>>.Ok(data);
        }

        public async Task<ServiceResult<PartSummaryDto>> GetByIdAsync(int partId)
        {
            var part = await _dbContext.VehicleParts
                .AsNoTracking()
                .Include(p => p.Vendor)
                .Include(p => p.PartImages)
                .FirstOrDefaultAsync(p => p.PartId == partId);

            if (part is null)
            {
                return ServiceResult<PartSummaryDto>.Fail(ServiceErrorType.NotFound, "Part not found.");
            }

            if (part.IsDeleted)
            {
                return ServiceResult<PartSummaryDto>.Fail(ServiceErrorType.NotFound, "Part not found.");
            }

            return ServiceResult<PartSummaryDto>.Ok(MapToSummary(part, part.Vendor.Name, part.Vendor.Email));
        }

        public async Task<ServiceResult<PartSummaryDto>> UpdateAsync(int partId, UpdatePartRequestDto request)
        {
            var part = await _dbContext.VehicleParts.Include(p => p.PartImages).FirstOrDefaultAsync(p => p.PartId == partId);
            if (part is null)
            {
                return ServiceResult<PartSummaryDto>.Fail(ServiceErrorType.NotFound, "Part not found.");
            }

            if (part.IsDeleted)
            {
                return ServiceResult<PartSummaryDto>.Fail(ServiceErrorType.Validation, "Archived part cannot be edited.");
            }

            var imageResult = NormalizeAndValidateImageUrls(request.ImageUrls);
            if (!imageResult.Success)
            {
                return ServiceResult<PartSummaryDto>.Fail(imageResult.Error!.Type, imageResult.Error.Message);
            }

            var previousImageUrls = part.PartImages
                .Select(pi => pi.ImageUrl)
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .ToList();

            part.Name = request.Name.Trim();
            part.Category = request.Category.Trim();
            part.Price = request.Price;

            _dbContext.VehiclePartImages.RemoveRange(part.PartImages);
            part.PartImages = imageResult.Data!.Select(url => new VehiclePartImage { ImageUrl = url, PartId = part.PartId }).ToList();

            await _dbContext.SaveChangesAsync();
            DeleteLocalPartUploads(previousImageUrls);
            _logger.LogInformation("Part updated: {PartId}", part.PartId);
            var vendorInfo = await _dbContext.Vendors
                .AsNoTracking()
                .Where(v => v.VendorId == part.VendorId)
                .Select(v => new { v.Name, v.Email })
                .FirstOrDefaultAsync();

            return ServiceResult<PartSummaryDto>.Ok(MapToSummary(part, vendorInfo?.Name ?? string.Empty, vendorInfo?.Email ?? string.Empty));
        }

        public async Task<ServiceResult<PartSummaryDto>> PurchaseAsync(int partId, PurchasePartStockRequestDto request)
        {
            var part = await _dbContext.VehicleParts
                .Include(p => p.Vendor)
                .Include(p => p.PartImages)
                .FirstOrDefaultAsync(p => p.PartId == partId);

            if (part is null)
            {
                return ServiceResult<PartSummaryDto>.Fail(ServiceErrorType.NotFound, "Part not found.");
            }

            if (part.IsDeleted)
            {
                return ServiceResult<PartSummaryDto>.Fail(ServiceErrorType.Validation, "Archived part cannot be purchased.");
            }

            checked { part.StockQuantity += request.Quantity; }

            await _dbContext.SaveChangesAsync();
            await TryCreateLowStockNotificationsAsync($"PART-PURCHASE-{partId}");
            _logger.LogInformation("Part stock purchased: {PartId}, Qty {Quantity}", part.PartId, request.Quantity);
            return ServiceResult<PartSummaryDto>.Ok(MapToSummary(part, part.Vendor.Name, part.Vendor.Email));
        }

        public async Task<ServiceResult<bool>> DeleteAsync(int partId)
        {
            var part = await _dbContext.VehicleParts
                .Include(p => p.OrderParts)
                .Include(p => p.PartImages)
                .FirstOrDefaultAsync(p => p.PartId == partId);

            if (part is null)
            {
                return ServiceResult<bool>.Fail(ServiceErrorType.NotFound, "Part not found.");
            }

            if (part.IsDeleted)
            {
                return ServiceResult<bool>.Ok(true);
            }

            // Soft delete: hide from active catalog, preserve stock and invoice history integrity.
            part.IsDeleted = true;
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("Part archived: {PartId}", part.PartId);
            return ServiceResult<bool>.Ok(true);
        }

        private static PartSummaryDto MapToSummary(VehiclePart part, string vendorName, string vendorEmail)
        {
            return new PartSummaryDto
            {
                PartId = part.PartId,
                Name = part.Name,
                Descriptions = part.Descriptions,
                Category = part.Category,
                Condition = part.Condition,
                Price = part.Price,
                StockQuantity = part.StockQuantity,
                VendorId = part.VendorId,
                VendorName = vendorName,
                VendorEmail = vendorEmail,
                ImageUrls = part.PartImages.OrderBy(pi => pi.ImageId).Select(pi => pi.ImageUrl).ToList()
            };
        }

        private static ServiceResult<IReadOnlyList<string>> NormalizeAndValidateImageUrls(IEnumerable<string>? imageUrls)
        {
            var normalizedUrls = (imageUrls ?? Array.Empty<string>())
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .Select(url => url.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(8)
                .ToList();

            if (normalizedUrls.Count < 4)
            {
                return ServiceResult<IReadOnlyList<string>>.Fail(ServiceErrorType.Validation, "At least 4 part images are required.");
            }

            return ServiceResult<IReadOnlyList<string>>.Ok(normalizedUrls);
        }

        private static ServiceResult<string> NormalizeAndValidateCondition(string? condition)
        {
            var normalized = (condition ?? string.Empty).Trim().ToLowerInvariant();

            return normalized switch
            {
                "new" => ServiceResult<string>.Ok("New"),
                "refurbished" => ServiceResult<string>.Ok("Refurbished"),
                _ => ServiceResult<string>.Fail(ServiceErrorType.Validation, "Condition must be either New or Refurbished."),
            };
        }

        private void DeleteLocalPartUploads(IEnumerable<string> imageUrls)
        {
            var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var partUploadDir = Path.Combine(webRoot, "uploads", "parts");

            foreach (var imageUrl in imageUrls)
            {
                if (!TryResolveLocalPartUploadPath(imageUrl, partUploadDir, out var filePath))
                {
                    continue;
                }

                try
                {
                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed deleting part image file: {FilePath}", filePath);
                }
            }
        }

        private static bool TryResolveLocalPartUploadPath(string imageUrl, string partUploadDir, out string filePath)
        {
            filePath = string.Empty;
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                return false;
            }

            if (!Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri))
            {
                return false;
            }

            var relativePath = Uri.UnescapeDataString(uri.AbsolutePath);
            if (!relativePath.StartsWith("/uploads/parts/", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            var fileName = Path.GetFileName(relativePath);
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return false;
            }

            filePath = Path.Combine(partUploadDir, fileName);
            return true;
        }

        private async Task TryCreateLowStockNotificationsAsync(string reference)
        {
            try
            {
                var notificationResult = await _notificationService.CheckLowStockAsync();
                if (!notificationResult.Success)
                {
                    _logger.LogWarning("Low stock notification check failed after part stock mutation {Reference}: {Message}",
                        reference,
                        notificationResult.Error?.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Low stock notification check failed after part stock mutation {Reference}.", reference);
            }
        }
    }
}
