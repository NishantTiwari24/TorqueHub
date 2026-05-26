using Microsoft.EntityFrameworkCore;
using WeatherAPI.DTOs.History;
using WeatherAPI.Models;
using WeatherAPI.Services.Interfaces;

namespace WeatherAPI.Services
{
    public class CustomerHistoryService : ICustomerHistoryService
    {
        private readonly AppDbContext _dbContext;

        public CustomerHistoryService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<CustomerHistoryDto?> GetFullHistoryForUserAsync(int userId, string? userEmail)
        {
            var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            return user is null ? null : await BuildHistoryAsync(user, includePurchases: true, includeServices: true);
        }

        public async Task<CustomerHistoryDto?> GetPurchaseHistoryForUserAsync(int userId, string? userEmail)
        {
            var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            return user is null ? null : await BuildHistoryAsync(user, includePurchases: true, includeServices: false);
        }

        public async Task<CustomerHistoryDto?> GetServiceHistoryForUserAsync(int userId, string? userEmail)
        {
            var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            return user is null ? null : await BuildHistoryAsync(user, includePurchases: false, includeServices: true);
        }

        public async Task<CustomerHistoryDto?> GetFullHistoryForCustomerAsync(int customerId)
        {
            var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == customerId);
            return user is null ? null : await BuildHistoryAsync(user, includePurchases: true, includeServices: true);
        }

        public async Task<CustomerHistoryDto?> GetPurchaseHistoryForCustomerAsync(int customerId)
        {
            var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == customerId);
            return user is null ? null : await BuildHistoryAsync(user, includePurchases: true, includeServices: false);
        }

        private async Task<CustomerHistoryDto> BuildHistoryAsync(User user, bool includePurchases, bool includeServices)
        {
            var items = new List<CustomerHistoryItemDto>();

            if (includeServices)
            {
                items.AddRange(await GetServiceHistoryItemsAsync(user.Id));
            }

            if (includePurchases)
            {
                items.AddRange(await GetPurchaseHistoryItemsAsync(user.Id));
            }

            var orderedItems = items
                .OrderByDescending(i => i.EventDateUtc)
                .ThenByDescending(i => i.HistoryId)
                .ToList();

            return new CustomerHistoryDto
            {
                CustomerId = user.Id,
                CustomerName = user.Name,
                TotalAmount = orderedItems.Sum(i => i.Amount ?? 0),
                Items = orderedItems
            };
        }

        private async Task<IReadOnlyList<CustomerHistoryItemDto>> GetServiceHistoryItemsAsync(int userId)
        {
            var serviceHistoryItems = await _dbContext.ServiceHistories
                .AsNoTracking()
                .Where(h => h.UserId == userId)
                .Select(h => new CustomerHistoryItemDto
                {
                    HistoryId = h.ServiceHistoryId,
                    HistoryType = h.HistoryType,
                    Description = h.Description,
                    ReferenceNumber = h.ReferenceNumber,
                    EventDateUtc = h.EventDateUtc,
                    Amount = h.Amount
                })
                .ToListAsync();

            var appointmentIdsWithServiceHistory = await _dbContext.ServiceHistories
                .AsNoTracking()
                .Where(h => h.UserId == userId && h.AppointmentId.HasValue)
                .Select(h => h.AppointmentId!.Value)
                .ToListAsync();

            var completedAppointments = await _dbContext.Appointments
                .AsNoTracking()
                .Include(a => a.Vehicle)
                .Where(a =>
                    a.UserId == userId &&
                    a.Status == AppointmentStatus.Completed &&
                    !appointmentIdsWithServiceHistory.Contains(a.AppointmentId))
                .ToListAsync();

            var completedAppointmentItems = completedAppointments
                .Select(a => new CustomerHistoryItemDto
                {
                    HistoryId = a.AppointmentId,
                    HistoryType = "Service",
                    Description = BuildCompletedAppointmentDescription(a),
                    ReferenceNumber = $"APT-{a.AppointmentId:D6}",
                    EventDateUtc = a.Date,
                    Amount = null
                })
                .ToList();

            serviceHistoryItems.AddRange(completedAppointmentItems);
            return serviceHistoryItems;
        }

        private static string BuildCompletedAppointmentDescription(Appointment appointment)
        {
            var vehicleName = appointment.Vehicle is null
                ? string.Empty
                : $"{appointment.Vehicle.Brand} {appointment.Vehicle.Model}".Trim();
            var serviceType = string.IsNullOrWhiteSpace(appointment.ServiceType) ? "Service" : appointment.ServiceType.Trim();
            var vehicleSuffix = string.IsNullOrWhiteSpace(vehicleName) ? string.Empty : $" for {vehicleName}";

            return $"Service completed: {serviceType}{vehicleSuffix}";
        }

        private async Task<IReadOnlyList<CustomerHistoryItemDto>> GetPurchaseHistoryItemsAsync(int userId)
        {
            var invoices = await _dbContext.SalesInvoices
                .AsNoTracking()
                .Where(i => i.CustomerId == userId)
                .Include(i => i.Items)
                    .ThenInclude(item => item.VehiclePart)
                .OrderByDescending(i => i.SaleDate)
                .ThenByDescending(i => i.SalesInvoiceId)
                .ToListAsync();

            var items = new List<CustomerHistoryItemDto>();
            foreach (var invoice in invoices)
            {
                if (invoice.Items.Count == 0)
                {
                    items.Add(new CustomerHistoryItemDto
                    {
                        HistoryId = invoice.SalesInvoiceId,
                        HistoryType = "Purchase",
                        Description = "Sales invoice with no item details",
                        ReferenceNumber = invoice.InvoiceNumber,
                        EventDateUtc = invoice.SaleDate,
                        Amount = invoice.FinalTotal,
                        PaymentStatus = invoice.PaymentStatus,
                        CreditDueDateUtc = invoice.CreditDueDate,
                        Discount = invoice.Discount,
                        FinalTotal = invoice.FinalTotal
                    });
                    continue;
                }

                foreach (var invoiceItem in invoice.Items.OrderBy(x => x.SalesInvoiceItemId))
                {
                    items.Add(new CustomerHistoryItemDto
                    {
                        HistoryId = invoiceItem.SalesInvoiceItemId,
                        HistoryType = "Purchase",
                        Description = invoiceItem.VehiclePart?.Name ?? "Vehicle part",
                        ReferenceNumber = invoice.InvoiceNumber,
                        EventDateUtc = invoice.SaleDate,
                        Amount = invoiceItem.LineTotal,
                        Quantity = invoiceItem.Quantity,
                        UnitPrice = invoiceItem.UnitPrice,
                        PaymentStatus = invoice.PaymentStatus,
                        CreditDueDateUtc = invoice.CreditDueDate,
                        Discount = invoice.Discount,
                        FinalTotal = invoice.FinalTotal
                    });
                }
            }

            return items;
        }
    }
}
