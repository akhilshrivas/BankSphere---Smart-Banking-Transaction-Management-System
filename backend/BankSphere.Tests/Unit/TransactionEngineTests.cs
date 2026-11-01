using BankSphere.Application.DTOs;
using BankSphere.Application.Interfaces;
using BankSphere.Application.Services;
using BankSphere.Domain.Entities;
using BankSphere.Domain.Enums;
using BankSphere.Infrastructure.Data;
using BankSphere.Infrastructure.Repositories;
using BankSphere.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BankSphere.Tests.Unit;

public class TransactionEngineTests
{
    private readonly BankSphereDbContext _context;
    private readonly BankingTransactionEngine _engine;
    private readonly FraudDetectionEngine _fraudEngine;
    private readonly ReconciliationService _reconciliationService;
    private readonly Mock<IRealtimeNotifier> _notifierMock;
    private readonly Mock<IAuditService> _auditMock;
    private readonly NotificationService _notificationService;

    public TransactionEngineTests()
    {
        var options = new DbContextOptionsBuilder<BankSphereDbContext>()
            .UseInMemoryDatabase(databaseName: "BankSphereTest_" + Guid.NewGuid())
            .Options;

        _context = new BankSphereDbContext(options);

        var accountRepo = new Repository<BankAccount>(_context);
        var txRepo = new Repository<BankTransaction>(_context);
        var ledgerRepo = new Repository<LedgerEntry>(_context);
        var alertRepo = new Repository<FraudAlert>(_context);
        var notifRepo = new Repository<Notification>(_context);
        var unitOfWork = new UnitOfWork(_context);

        _notifierMock = new Mock<IRealtimeNotifier>();
        _auditMock = new Mock<IAuditService>();
        _notificationService = new NotificationService(notifRepo, unitOfWork, _notifierMock.Object);

        _fraudEngine = new FraudDetectionEngine(alertRepo, txRepo, unitOfWork, _notifierMock.Object);

        _engine = new BankingTransactionEngine(
            accountRepo,
            txRepo,
            ledgerRepo,
            _fraudEngine,
            unitOfWork,
            _auditMock.Object,
            _notifierMock.Object,
            _notificationService);

        _reconciliationService = new ReconciliationService(_context);
    }

    [Fact]
    public async Task SuccessfulDeposit_UpdatesBalance_And_CreatesBalancedLedgerEntries()
    {
        // Arrange
        var customer = new Customer { CustomerNumber = "CUST-001" };
        var accountType = new AccountType { Name = "Checking", DailyTransferLimit = 10000m };
        var account = new BankAccount
        {
            AccountNumber = "10000001",
            Customer = customer,
            AccountType = accountType,
            Balance = 0m,
            AvailableBalance = 0m,
            Status = AccountStatus.Active
        };
        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();

        var request = new DepositRequestDto(account.Id, 250m, "Test deposit");

        // Act
        var result = await _engine.ProcessDepositAsync(request, Guid.NewGuid());

        // Assert
        Assert.Equal(250m, result.LedgerEntries.First(l => l.AccountNumber == account.AccountNumber).BalanceAfter);
        var updatedAccount = await _context.Accounts.FindAsync(account.Id);
        Assert.NotNull(updatedAccount);
        Assert.Equal(250m, updatedAccount.Balance);
        Assert.Equal(250m, updatedAccount.AvailableBalance);

        // Verify balanced double-entry ledger: Sum(Debits) == Sum(Credits)
        var debitSum = result.LedgerEntries.Where(l => l.EntryType == LedgerEntryType.Debit).Sum(l => l.Amount);
        var creditSum = result.LedgerEntries.Where(l => l.EntryType == LedgerEntryType.Credit).Sum(l => l.Amount);
        Assert.Equal(250m, debitSum);
        Assert.Equal(250m, creditSum);
        Assert.Equal(debitSum, creditSum);

        // Verify Authoritative Ledger Reconciliation
        var recon = await _reconciliationService.ReconcileAccountAsync(account.Id);
        Assert.True(recon.IsReconciled);
        Assert.Equal(0m, recon.Discrepancy);
    }

    [Fact]
    public async Task SuccessfulWithdrawal_DecreasesBalance_And_MaintainsLedger()
    {
        // Arrange
        var customer = new Customer { CustomerNumber = "CUST-002" };
        var account = new BankAccount
        {
            AccountNumber = "10000002",
            Customer = customer,
            Balance = 1000m,
            AvailableBalance = 1000m,
            Status = AccountStatus.Active
        };
        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();

        var request = new WithdrawalRequestDto(account.Id, 300m, "ATM Withdrawal");

        // Act
        var result = await _engine.ProcessWithdrawalAsync(request, Guid.NewGuid());

        // Assert
        Assert.Equal(TransactionStatus.Completed, result.Status);
        var updated = await _context.Accounts.FindAsync(account.Id);
        Assert.NotNull(updated);
        Assert.Equal(700m, updated.Balance);
        Assert.Equal(700m, updated.AvailableBalance);

        var debitSum = result.LedgerEntries.Where(l => l.EntryType == LedgerEntryType.Debit).Sum(l => l.Amount);
        var creditSum = result.LedgerEntries.Where(l => l.EntryType == LedgerEntryType.Credit).Sum(l => l.Amount);
        Assert.Equal(debitSum, creditSum);
    }

    [Fact]
    public async Task InsufficientBalanceWithdrawal_ThrowsInvalidOperationException_AndRollsBack()
    {
        // Arrange
        var customer = new Customer { CustomerNumber = "CUST-003" };
        var account = new BankAccount
        {
            AccountNumber = "10000003",
            Customer = customer,
            Balance = 150m,
            AvailableBalance = 150m,
            Status = AccountStatus.Active
        };
        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();

        var request = new WithdrawalRequestDto(account.Id, 500m, "Overdraft attempt");

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _engine.ProcessWithdrawalAsync(request, Guid.NewGuid()));

        // Verify balance was untouched
        var unchanged = await _context.Accounts.FindAsync(account.Id);
        Assert.NotNull(unchanged);
        Assert.Equal(150m, unchanged.Balance);
    }

    [Fact]
    public async Task SuccessfulTransfer_MovesFundsBetweenAccounts_AndMaintainsDoubleEntry()
    {
        // Arrange
        var cust1 = new Customer { CustomerNumber = "CUST-A" };
        var cust2 = new Customer { CustomerNumber = "CUST-B" };

        var source = new BankAccount
        {
            AccountNumber = "10000010",
            Customer = cust1,
            Balance = 2000m,
            AvailableBalance = 2000m,
            Status = AccountStatus.Active
        };

        var dest = new BankAccount
        {
            AccountNumber = "10000020",
            Customer = cust2,
            Balance = 500m,
            AvailableBalance = 500m,
            Status = AccountStatus.Active
        };

        _context.Accounts.AddRange(source, dest);
        await _context.SaveChangesAsync();

        var request = new TransferRequestDto(source.Id, dest.AccountNumber, 400m, "Payment for services");

        // Act
        var result = await _engine.ProcessTransferAsync(request, Guid.NewGuid());

        // Assert
        Assert.Equal(TransactionStatus.Completed, result.Status);

        var updatedSource = await _context.Accounts.FindAsync(source.Id);
        var updatedDest = await _context.Accounts.FindAsync(dest.Id);

        Assert.NotNull(updatedSource);
        Assert.NotNull(updatedDest);

        Assert.Equal(1600m, updatedSource.Balance);
        Assert.Equal(900m, updatedDest.Balance);

        // Verify ledger entries
        Assert.Equal(2, result.LedgerEntries.Count);
        var debit = result.LedgerEntries.First(l => l.EntryType == LedgerEntryType.Debit);
        var credit = result.LedgerEntries.First(l => l.EntryType == LedgerEntryType.Credit);

        Assert.Equal(source.AccountNumber, debit.AccountNumber);
        Assert.Equal(400m, debit.Amount);
        Assert.Equal(1600m, debit.BalanceAfter);

        Assert.Equal(dest.AccountNumber, credit.AccountNumber);
        Assert.Equal(400m, credit.Amount);
        Assert.Equal(900m, credit.BalanceAfter);

        Assert.Equal(debit.Amount, credit.Amount);
    }

    [Fact]
    public async Task FrozenAccountTransferRejection_ThrowsException()
    {
        // Arrange
        var cust = new Customer { CustomerNumber = "CUST-FROZEN" };
        var frozenSource = new BankAccount
        {
            AccountNumber = "10000030",
            Customer = cust,
            Balance = 5000m,
            AvailableBalance = 5000m,
            Status = AccountStatus.Frozen
        };

        var dest = new BankAccount
        {
            AccountNumber = "10000040",
            Customer = cust,
            Balance = 100m,
            AvailableBalance = 100m,
            Status = AccountStatus.Active
        };

        _context.Accounts.AddRange(frozenSource, dest);
        await _context.SaveChangesAsync();

        var request = new TransferRequestDto(frozenSource.Id, dest.AccountNumber, 50m, "Attempt transfer from frozen");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _engine.ProcessTransferAsync(request, Guid.NewGuid()));

        Assert.Contains("Frozen", ex.Message);
    }
}
