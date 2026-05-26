using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WeatherAPI.Models;

public class AppDbContext : IdentityDbContext<User, IdentityRole<int>, int>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Vendor> Vendors { get; set; }
    public DbSet<VehiclePart> VehicleParts { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderPart> OrderParts { get; set; }
    public DbSet<Vehicle> Vehicles { get; set; }
    public DbSet<ServiceHistory> ServiceHistories { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<PartRequest> PartRequests { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<EmailLog> EmailLogs { get; set; }
    public DbSet<VehiclePartImage> VehiclePartImages { get; set; }
    public DbSet<PurchaseInvoice> PurchaseInvoices { get; set; }
    public DbSet<PurchaseInvoiceItem> PurchaseInvoiceItems { get; set; }
    public DbSet<SalesInvoice> SalesInvoices { get; set; }
    public DbSet<SalesInvoiceItem> SalesInvoiceItems { get; set; }
    public DbSet<StockTransaction> StockTransactions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Composite Key for OrderPart (M:N Join Table)
        modelBuilder.Entity<OrderPart>()
            .HasKey(op => new { op.OrderId, op.PartId });

        // Configure relationships to avoid multiple cascade paths for Appointment
        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.User)
            .WithMany(u => u.Appointments)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Vehicle)
            .WithMany(v => v.Appointments)
            .HasForeignKey(a => a.VehicleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Vehicle>()
            .HasOne(v => v.User)
            .WithMany(u => u.Vehicles)
            .HasForeignKey(v => v.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<PartRequest>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PartRequest>()
            .HasOne(r => r.Vehicle)
            .WithMany()
            .HasForeignKey(r => r.VehicleId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Appointment)
            .WithMany()
            .HasForeignKey(r => r.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ServiceHistory>()
            .HasOne(h => h.Appointment)
            .WithMany()
            .HasForeignKey(h => h.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<EmailLog>()
            .HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<EmailLog>()
            .HasOne(e => e.SentByUser)
            .WithMany()
            .HasForeignKey(e => e.SentByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Vehicle>()
            .HasIndex(v => v.VehicleNumber)
            .IsUnique();

        // Additional configuration for precision if needed
        modelBuilder.Entity<VehiclePart>()
            .Property(p => p.Price)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Order>()
            .Property(o => o.TotalPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<ServiceHistory>()
            .Property(h => h.Amount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<PurchaseInvoice>()
            .HasIndex(i => i.InvoiceNumber)
            .IsUnique();

        modelBuilder.Entity<PurchaseInvoice>()
            .Property(i => i.TotalAmount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<PurchaseInvoiceItem>()
            .Property(i => i.UnitCost)
            .HasPrecision(18, 2);

        modelBuilder.Entity<PurchaseInvoiceItem>()
            .Property(i => i.LineTotal)
            .HasPrecision(18, 2);

        modelBuilder.Entity<SalesInvoice>()
            .HasIndex(i => i.InvoiceNumber)
            .IsUnique();

        modelBuilder.Entity<SalesInvoice>()
            .HasOne(i => i.Customer)
            .WithMany(u => u.CustomerSalesInvoices)
            .HasForeignKey(i => i.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SalesInvoice>()
            .HasOne(i => i.Staff)
            .WithMany(u => u.StaffSalesInvoices)
            .HasForeignKey(i => i.StaffId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SalesInvoice>()
            .Property(i => i.Subtotal)
            .HasPrecision(18, 2);

        modelBuilder.Entity<SalesInvoice>()
            .Property(i => i.Discount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<SalesInvoice>()
            .Property(i => i.FinalTotal)
            .HasPrecision(18, 2);

        modelBuilder.Entity<SalesInvoice>()
            .Property(i => i.PaidAmount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<SalesInvoiceItem>()
            .Property(i => i.UnitPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<SalesInvoiceItem>()
            .Property(i => i.LineTotal)
            .HasPrecision(18, 2);

        modelBuilder.Entity<StockTransaction>()
            .HasOne(t => t.SalesInvoice)
            .WithMany(i => i.StockTransactions)
            .HasForeignKey(t => t.SalesInvoiceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
