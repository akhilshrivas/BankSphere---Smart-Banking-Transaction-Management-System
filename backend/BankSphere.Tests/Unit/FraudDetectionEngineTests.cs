using BankSphere.Application.DTOs;
using BankSphere.Application.Interfaces;
using BankSphere.Application.Services;
using BankSphere.Domain.Entities;
using BankSphere.Domain.Enums;
using BankSphere.Infrastructure.Data;
using BankSphere.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BankSphere.Tests.Unit;

public class FraudDetectionEngineTests
{
    private readonly BankSphereDbContext _context;
    private readonly FraudDetectionEngine _engine;
    private readonly Mock<IRealtimeNotifier> _notifierMock;

    public FraudDetectionEngineTests()
    {
        var options = new DbContextOptionsBuilder<BankSphereDbContext>()
            .UseInMemoryDatabase("BankSphereFraudTest_" + Guid.NewGuid())
            .Options;

        _context = new BankSphereDbContext(options);
        var alertRepo = new Repository<FraudAlert>(_context);
        var txRepo = new Repository<BankTransaction>(_context);
        var unitOfWork = new UnitOfWork(_context);
        _notifierMock = new Mock<IRealtimeNotifier>();

        _engine = new FraudDetectionEngine(alertRepo, txRepo, unitOfWork, _notifierMock.Object);
    }

    [Fact]
    public async Task HighValueTransaction_TriggersHighSeverityAlert()
    {
        // Arrange
        var customer = new Customer { CustomerNumber = "CUST-FRAUD-1", Country = "US" };
        var account = new BankAccount { AccountNumber = "10009991", Balance = 20000m, Customer = customer };

        var transaction = new BankTransaction
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = "TX-HV-1",
            Amount = 15000m,
            Type = TransactionType.Transfer
        };

        // Act
        var alerts = await _engine.EvaluateTransactionAsync(transaction, account);

        // Assert
        Assert.Contains(alerts, a => a.RuleName == "HighValueThreshold" && a.Severity == AlertSeverity.High);
    }

    [Fact]
    public async Task CriticalHighValueTransaction_TriggersCriticalSeverityAlert()
    {
        // Arrange
        var customer = new Customer { CustomerNumber = "CUST-FRAUD-2", Country = "US" };
        var account = new BankAccount { AccountNumber = "10009992", Balance = 100000m, Customer = customer };

        var transaction = new BankTransaction
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = "TX-CRIT-1",
            Amount = 60000m,
            Type = TransactionType.Transfer
        };

        // Act
        var alerts = await _engine.EvaluateTransactionAsync(transaction, account);

        // Assert
        Assert.Contains(alerts, a => a.RuleName == "CriticalHighValueThreshold" && a.Severity == AlertSeverity.Critical);
        Assert.True(alerts.First().RiskScore >= 90m);
    }

    [Fact]
    public async Task BalanceDrain_TriggersRapidBalanceDrainAlert()
    {
        // Arrange
        var customer = new Customer { CustomerNumber = "CUST-FRAUD-3" };
        var account = new BankAccount { AccountNumber = "10009993", Balance = 5000m, Customer = customer };

        // Attempting to transfer 90% of account ($4500)
        var transaction = new BankTransaction
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = "TX-DRAIN-1",
            Amount = 4500m,
            Type = TransactionType.Transfer
        };

        // Act
        var alerts = await _engine.EvaluateTransactionAsync(transaction, account);

        // Assert
        Assert.Contains(alerts, a => a.RuleName == "RapidBalanceDrain");
    }

    [Fact]
    public async Task GeographicMismatch_TriggersOriginMismatchAlert()
    {
        // Arrange
        var customer = new Customer { CustomerNumber = "CUST-FRAUD-4", Country = "United States" };
        var account = new BankAccount { AccountNumber = "10009994", Balance = 10000m, Customer = customer };

        var transaction = new BankTransaction
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = "TX-GEO-1",
            Amount = 1000m,
            LocationCountry = "Nigeria",
            Type = TransactionType.Transfer
        };

        // Act
        var alerts = await _engine.EvaluateTransactionAsync(transaction, account);

        // Assert
        Assert.Contains(alerts, a => a.RuleName == "GeographicOriginMismatch" && a.Severity == AlertSeverity.Medium);
    }

    [Fact]
    public async Task ReviewFraudAlert_UpdatesStatusAndAuditsCompliance()
    {
        // Arrange
        var alert = new FraudAlert
        {
            TransactionId = Guid.NewGuid(),
            RuleName = "HighValueThreshold",
            Severity = AlertSeverity.High,
            Status = AlertStatus.Pending
        };
        _context.FraudAlerts.Add(alert);
        await _context.SaveChangesAsync();

        var reviewDto = new ReviewFraudAlertDto(AlertStatus.Cleared, "Customer confirmed large domestic business transaction via phone verification.");

        // Act
        var success = await _engine.ReviewAlertAsync(alert.Id, reviewDto, "compliance.officer@banksphere.com");

        // Assert
        Assert.True(success);
        var updated = await _context.FraudAlerts.FindAsync(alert.Id);
        Assert.NotNull(updated);
        Assert.Equal(AlertStatus.Cleared, updated.Status);
        Assert.Equal("compliance.officer@banksphere.com", updated.ResolvedBy);
        Assert.NotNull(updated.ResolvedAt);
    }
}
