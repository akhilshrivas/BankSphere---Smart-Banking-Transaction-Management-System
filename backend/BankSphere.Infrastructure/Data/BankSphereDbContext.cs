using BankSphere.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BankSphere.Infrastructure.Data;

public class BankSphereDbContext : DbContext
{
    public BankSphereDbContext(DbContextOptions<BankSphereDbContext> options) : base(options)
    {
    }

    public DbSet<ApplicationUser> Users => Set<ApplicationUser>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<BankAccount> Accounts => Set<BankAccount>();
    public DbSet<AccountType> AccountTypes => Set<AccountType>();
    public DbSet<BankTransaction> Transactions => Set<BankTransaction>();
    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();
    public DbSet<Beneficiary> Beneficiaries => Set<Beneficiary>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<FraudAlert> FraudAlerts => Set<FraudAlert>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ApplicationUser
        modelBuilder.Entity<ApplicationUser>(b =>
        {
            b.HasKey(u => u.Id);
            b.HasIndex(u => u.Email).IsUnique();
            b.Property(u => u.Email).HasMaxLength(150).IsRequired();
            b.Property(u => u.UserName).HasMaxLength(100).IsRequired();
            b.Property(u => u.PasswordHash).IsRequired();
            b.Property(u => u.FirstName).HasMaxLength(50);
            b.Property(u => u.LastName).HasMaxLength(50);
            b.Property(u => u.Role).HasMaxLength(50);

            b.HasOne(u => u.Customer)
                .WithOne(c => c.User)
                .HasForeignKey<Customer>(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Customer
        modelBuilder.Entity<Customer>(b =>
        {
            b.HasKey(c => c.Id);
            b.HasIndex(c => c.CustomerNumber).IsUnique();
            b.Property(c => c.CustomerNumber).HasMaxLength(30).IsRequired();
            b.Property(c => c.PhoneNumber).HasMaxLength(30);

            b.HasMany(c => c.BankAccounts)
                .WithOne(a => a.Customer)
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasMany(c => c.Beneficiaries)
                .WithOne(ben => ben.Customer)
                .HasForeignKey(ben => ben.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasMany(c => c.Notifications)
                .WithOne(n => n.Customer)
                .HasForeignKey(n => n.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Role
        modelBuilder.Entity<Role>(b =>
        {
            b.HasKey(r => r.Id);
            b.HasIndex(r => r.Name).IsUnique();
            b.Property(r => r.Name).HasMaxLength(50).IsRequired();
        });

        // AccountType
        modelBuilder.Entity<AccountType>(b =>
        {
            b.HasKey(t => t.Id);
            b.Property(t => t.Name).HasMaxLength(50).IsRequired();
            b.Property(t => t.InterestRate).HasColumnType("decimal(19,4)");
            b.Property(t => t.MinimumBalance).HasColumnType("decimal(19,4)");
            b.Property(t => t.DailyTransferLimit).HasColumnType("decimal(19,4)");
        });

        // BankAccount
        modelBuilder.Entity<BankAccount>(b =>
        {
            b.HasKey(a => a.Id);
            b.HasIndex(a => a.AccountNumber).IsUnique();
            b.Property(a => a.AccountNumber).HasMaxLength(30).IsRequired();
            b.Property(a => a.Currency).HasMaxLength(10).IsRequired();
            b.Property(a => a.Balance).HasColumnType("decimal(19,4)");
            b.Property(a => a.AvailableBalance).HasColumnType("decimal(19,4)");

            b.HasOne(a => a.AccountType)
                .WithMany(t => t.BankAccounts)
                .HasForeignKey(a => a.AccountTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // BankTransaction
        modelBuilder.Entity<BankTransaction>(b =>
        {
            b.HasKey(t => t.Id);
            b.HasIndex(t => t.ReferenceNumber).IsUnique();
            b.HasIndex(t => t.IdempotencyKey);
            b.Property(t => t.ReferenceNumber).HasMaxLength(50).IsRequired();
            b.Property(t => t.IdempotencyKey).HasMaxLength(100);
            b.Property(t => t.Amount).HasColumnType("decimal(19,4)");
            b.Property(t => t.Fee).HasColumnType("decimal(19,4)");
            b.Property(t => t.Currency).HasMaxLength(10).IsRequired();
            b.Property(t => t.Description).HasMaxLength(250);

            b.HasOne(t => t.SourceAccount)
                .WithMany()
                .HasForeignKey(t => t.SourceAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(t => t.DestinationAccount)
                .WithMany()
                .HasForeignKey(t => t.DestinationAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasMany(t => t.LedgerEntries)
                .WithOne(l => l.Transaction)
                .HasForeignKey(l => l.TransactionId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasMany(t => t.FraudAlerts)
                .WithOne(f => f.Transaction)
                .HasForeignKey(f => f.TransactionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // LedgerEntry
        modelBuilder.Entity<LedgerEntry>(b =>
        {
            b.HasKey(l => l.Id);
            b.Property(l => l.Amount).HasColumnType("decimal(19,4)");
            b.Property(l => l.BalanceAfter).HasColumnType("decimal(19,4)");
            b.Property(l => l.AccountNumber).HasMaxLength(30).IsRequired();
            b.Property(l => l.Description).HasMaxLength(250);

            b.HasOne(l => l.BankAccount)
                .WithMany(a => a.LedgerEntries)
                .HasForeignKey(l => l.BankAccountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Beneficiary
        modelBuilder.Entity<Beneficiary>(b =>
        {
            b.HasKey(ben => ben.Id);
            b.Property(ben => ben.Name).HasMaxLength(100).IsRequired();
            b.Property(ben => ben.AccountNumber).HasMaxLength(30).IsRequired();
            b.Property(ben => ben.BankName).HasMaxLength(100);
            b.Property(ben => ben.RoutingNumber).HasMaxLength(50);
        });

        // RefreshToken
        modelBuilder.Entity<RefreshToken>(b =>
        {
            b.HasKey(r => r.Id);
            b.HasIndex(r => r.TokenHash).IsUnique();
            b.Property(r => r.TokenHash).HasMaxLength(256).IsRequired();
            b.Property(r => r.JwtId).HasMaxLength(100).IsRequired();

            b.HasOne(r => r.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(b =>
        {
            b.HasKey(a => a.Id);
            b.Property(a => a.Action).HasMaxLength(100).IsRequired();
            b.Property(a => a.EntityName).HasMaxLength(100).IsRequired();
            b.Property(a => a.UserEmail).HasMaxLength(150);

            b.HasOne(a => a.User)
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // FraudAlert
        modelBuilder.Entity<FraudAlert>(b =>
        {
            b.HasKey(f => f.Id);
            b.Property(f => f.RuleName).HasMaxLength(100).IsRequired();
            b.Property(f => f.RiskScore).HasColumnType("decimal(19,4)");
        });

        // Notification
        modelBuilder.Entity<Notification>(b =>
        {
            b.HasKey(n => n.Id);
            b.Property(n => n.Title).HasMaxLength(150).IsRequired();
            b.Property(n => n.Message).HasMaxLength(500).IsRequired();
        });
    }
}
