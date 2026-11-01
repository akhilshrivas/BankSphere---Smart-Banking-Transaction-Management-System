using BankSphere.Application.DTOs;
using BankSphere.Application.Interfaces;
using BankSphere.Domain.Entities;
using BankSphere.Domain.Enums;
using BankSphere.Domain.Interfaces;

namespace BankSphere.Application.Services;

public class BankingTransactionEngine : ITransactionEngine
{
    private readonly IRepository<BankAccount> _accountRepo;
    private readonly IRepository<BankTransaction> _txRepo;
    private readonly IRepository<LedgerEntry> _ledgerRepo;
    private readonly IFraudDetectionEngine _fraudEngine;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditService _auditService;
    private readonly IRealtimeNotifier _notifier;
    private readonly INotificationService _notificationService;

    public BankingTransactionEngine(
        IRepository<BankAccount> accountRepo,
        IRepository<BankTransaction> txRepo,
        IRepository<LedgerEntry> ledgerRepo,
        IFraudDetectionEngine fraudEngine,
        IUnitOfWork unitOfWork,
        IAuditService auditService,
        IRealtimeNotifier notifier,
        INotificationService notificationService)
    {
        _accountRepo = accountRepo;
        _txRepo = txRepo;
        _ledgerRepo = ledgerRepo;
        _fraudEngine = fraudEngine;
        _unitOfWork = unitOfWork;
        _auditService = auditService;
        _notifier = notifier;
        _notificationService = notificationService;
    }

    public async Task<TransactionDto> ProcessDepositAsync(DepositRequestDto request, Guid userId, CancellationToken cancellationToken = default)
    {
        if (request.Amount <= 0)
            throw new ArgumentException("Deposit amount must be positive.");

        var account = await _accountRepo.GetByIdAsync(request.AccountId, cancellationToken)
            ?? throw new KeyNotFoundException($"Bank account {request.AccountId} not found.");

        if (account.Status != AccountStatus.Active)
            throw new InvalidOperationException($"Cannot deposit to account in {account.Status} status.");

        var reference = "DEP-" + Guid.NewGuid().ToString("N")[..8].ToUpper();
        var tx = new BankTransaction
        {
            ReferenceNumber = reference,
            Type = TransactionType.Deposit,
            Status = TransactionStatus.Completed,
            Amount = request.Amount,
            Currency = account.Currency,
            Description = request.Description ?? "Cash / Electronic Deposit",
            DestinationAccountId = account.Id,
            ProcessedAt = DateTime.UtcNow
        };

        await _txRepo.AddAsync(tx, cancellationToken);

        // Update balance
        account.Balance += request.Amount;
        account.AvailableBalance += request.Amount;
        _accountRepo.Update(account);

        // Double-entry:
        // 1. Debit Central Reserve Asset (money enters bank reserve)
        var debitReserve = new LedgerEntry
        {
            TransactionId = tx.Id,
            BankAccountId = null,
            AccountNumber = "SYS-RESERVE-001",
            EntryType = LedgerEntryType.Debit,
            Amount = request.Amount,
            BalanceAfter = 0m,
            Description = $"Central Reserve Cash Inflow for {account.AccountNumber}"
        };

        // 2. Credit Customer Account (bank liability increases)
        var creditCustomer = new LedgerEntry
        {
            TransactionId = tx.Id,
            BankAccountId = account.Id,
            AccountNumber = account.AccountNumber,
            EntryType = LedgerEntryType.Credit,
            Amount = request.Amount,
            BalanceAfter = account.Balance,
            Description = $"Deposit credited to {account.AccountNumber}"
        };

        await _ledgerRepo.AddAsync(debitReserve, cancellationToken);
        await _ledgerRepo.AddAsync(creditCustomer, cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);

        await _auditService.LogAsync(userId, "System", "Deposit", "BankAccount", account.Id.ToString(), $"Deposited ${request.Amount:N2} to {account.AccountNumber}");
        await _notifier.NotifyAccountBalanceChangedAsync(account.Id, account.Balance, account.AvailableBalance);
        await _notificationService.CreateNotificationAsync(account.CustomerId, "Deposit Successful", $"${request.Amount:N2} was deposited to account {account.AccountNumber}.", NotificationType.TransactionAlert, cancellationToken);

        return MapToDto(tx, new[] { debitReserve, creditCustomer }, Array.Empty<FraudAlert>(), null, account);
    }

    public async Task<TransactionDto> ProcessWithdrawalAsync(WithdrawalRequestDto request, Guid userId, CancellationToken cancellationToken = default)
    {
        if (request.Amount <= 0)
            throw new ArgumentException("Withdrawal amount must be positive.");

        var account = await _accountRepo.GetByIdAsync(request.AccountId, cancellationToken)
            ?? throw new KeyNotFoundException($"Bank account {request.AccountId} not found.");

        if (account.Status != AccountStatus.Active)
            throw new InvalidOperationException($"Account is {account.Status}. Withdrawals are not permitted.");

        if (account.AvailableBalance < request.Amount)
            throw new InvalidOperationException($"Insufficient funds. Available: ${account.AvailableBalance:N2}, Requested: ${request.Amount:N2}.");

        var reference = "WTH-" + Guid.NewGuid().ToString("N")[..8].ToUpper();
        var tx = new BankTransaction
        {
            ReferenceNumber = reference,
            Type = TransactionType.Withdrawal,
            Status = TransactionStatus.Completed,
            Amount = request.Amount,
            Currency = account.Currency,
            Description = request.Description ?? "Cash / ATM Withdrawal",
            SourceAccountId = account.Id,
            ProcessedAt = DateTime.UtcNow
        };

        await _txRepo.AddAsync(tx, cancellationToken);

        // Update balance
        account.Balance -= request.Amount;
        account.AvailableBalance -= request.Amount;
        _accountRepo.Update(account);

        // Double-entry:
        // 1. Debit Customer Account (bank liability decreases)
        var debitCustomer = new LedgerEntry
        {
            TransactionId = tx.Id,
            BankAccountId = account.Id,
            AccountNumber = account.AccountNumber,
            EntryType = LedgerEntryType.Debit,
            Amount = request.Amount,
            BalanceAfter = account.Balance,
            Description = $"Withdrawal debited from {account.AccountNumber}"
        };

        // 2. Credit Central Reserve (cash leaves vault)
        var creditReserve = new LedgerEntry
        {
            TransactionId = tx.Id,
            BankAccountId = null,
            AccountNumber = "SYS-RESERVE-001",
            EntryType = LedgerEntryType.Credit,
            Amount = request.Amount,
            BalanceAfter = 0m,
            Description = $"Central Reserve Cash Outflow for {account.AccountNumber}"
        };

        await _ledgerRepo.AddAsync(debitCustomer, cancellationToken);
        await _ledgerRepo.AddAsync(creditReserve, cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);

        await _auditService.LogAsync(userId, "System", "Withdrawal", "BankAccount", account.Id.ToString(), $"Withdrew ${request.Amount:N2} from {account.AccountNumber}");
        await _notifier.NotifyAccountBalanceChangedAsync(account.Id, account.Balance, account.AvailableBalance);
        await _notificationService.CreateNotificationAsync(account.CustomerId, "Withdrawal Processed", $"${request.Amount:N2} was withdrawn from account {account.AccountNumber}.", NotificationType.TransactionAlert, cancellationToken);

        return MapToDto(tx, new[] { debitCustomer, creditReserve }, Array.Empty<FraudAlert>(), account, null);
    }

    public async Task<TransactionDto> ProcessTransferAsync(TransferRequestDto request, Guid userId, CancellationToken cancellationToken = default)
    {
        if (request.Amount <= 0)
            throw new ArgumentException("Transfer amount must be positive.");

        var sourceAccount = await _accountRepo.GetByIdAsync(request.SourceAccountId, cancellationToken)
            ?? throw new KeyNotFoundException($"Source account {request.SourceAccountId} not found.");

        if (sourceAccount.Status != AccountStatus.Active)
            throw new InvalidOperationException($"Source account is {sourceAccount.Status}. Transfers cannot be initiated.");

        if (sourceAccount.AvailableBalance < request.Amount)
            throw new InvalidOperationException($"Insufficient funds. Available: ${sourceAccount.AvailableBalance:N2}, Requested: ${request.Amount:N2}.");

        var destAccounts = await _accountRepo.FindAsync(a => a.AccountNumber == request.DestinationAccountNumber, cancellationToken);
        var destAccount = destAccounts.FirstOrDefault()
            ?? throw new KeyNotFoundException($"Destination account '{request.DestinationAccountNumber}' was not found.");

        if (destAccount.Id == sourceAccount.Id)
            throw new InvalidOperationException("Cannot transfer funds to the same account.");

        if (destAccount.Status == AccountStatus.Closed)
            throw new InvalidOperationException("Destination account is closed.");

        var reference = "TRF-" + Guid.NewGuid().ToString("N")[..8].ToUpper();
        var tx = new BankTransaction
        {
            ReferenceNumber = reference,
            IdempotencyKey = request.IdempotencyKey,
            Type = TransactionType.Transfer,
            Status = TransactionStatus.Completed,
            Amount = request.Amount,
            Currency = sourceAccount.Currency,
            Description = request.Description ?? $"Transfer to {destAccount.AccountNumber}",
            SourceAccountId = sourceAccount.Id,
            DestinationAccountId = destAccount.Id,
            IpAddress = request.ClientIp,
            UserAgent = request.UserAgent,
            LocationCity = request.LocationCity,
            LocationCountry = request.LocationCountry,
            CreatedAt = DateTime.UtcNow
        };

        // Fraud Rules Engine evaluation
        var fraudAlerts = await _fraudEngine.EvaluateTransactionAsync(tx, sourceAccount, cancellationToken);
        bool hasCriticalFraud = fraudAlerts.Any(a => a.Severity == AlertSeverity.Critical);

        if (hasCriticalFraud)
        {
            tx.Status = TransactionStatus.Flagged;
            tx.FailureReason = "Transaction flagged by Automated Fraud Prevention System. Pending Compliance Review.";
            await _txRepo.AddAsync(tx, cancellationToken);
            await _unitOfWork.CommitAsync(cancellationToken);

            foreach (var fa in fraudAlerts)
            {
                await _notifier.NotifyFraudAlertAsync(new FraudAlertDto(
                    fa.Id,
                    tx.Id,
                    tx.ReferenceNumber,
                    fa.RuleName,
                    fa.Severity,
                    fa.Status,
                    fa.Description,
                    fa.RiskScore,
                    fa.CreatedAt,
                    null, null, null));
            }

            return MapToDto(tx, Array.Empty<LedgerEntry>(), fraudAlerts, sourceAccount, destAccount);
        }

        // Apply balances
        sourceAccount.Balance -= request.Amount;
        sourceAccount.AvailableBalance -= request.Amount;
        _accountRepo.Update(sourceAccount);

        destAccount.Balance += request.Amount;
        destAccount.AvailableBalance += request.Amount;
        _accountRepo.Update(destAccount);

        tx.ProcessedAt = DateTime.UtcNow;
        await _txRepo.AddAsync(tx, cancellationToken);

        // Double-entry Ledger entries
        // 1. Debit Source Account
        var debitEntry = new LedgerEntry
        {
            TransactionId = tx.Id,
            BankAccountId = sourceAccount.Id,
            AccountNumber = sourceAccount.AccountNumber,
            EntryType = LedgerEntryType.Debit,
            Amount = request.Amount,
            BalanceAfter = sourceAccount.Balance,
            Description = $"Debit for transfer to {destAccount.AccountNumber} ({reference})"
        };

        // 2. Credit Destination Account
        var creditEntry = new LedgerEntry
        {
            TransactionId = tx.Id,
            BankAccountId = destAccount.Id,
            AccountNumber = destAccount.AccountNumber,
            EntryType = LedgerEntryType.Credit,
            Amount = request.Amount,
            BalanceAfter = destAccount.Balance,
            Description = $"Credit transfer from {sourceAccount.AccountNumber} ({reference})"
        };

        await _ledgerRepo.AddAsync(debitEntry, cancellationToken);
        await _ledgerRepo.AddAsync(creditEntry, cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);

        // Audit & notifications
        await _auditService.LogAsync(userId, "User", "Transfer", "BankTransaction", tx.Id.ToString(), $"Transferred ${request.Amount:N2} from {sourceAccount.AccountNumber} to {destAccount.AccountNumber}");
        await _notifier.NotifyAccountBalanceChangedAsync(sourceAccount.Id, sourceAccount.Balance, sourceAccount.AvailableBalance);
        await _notifier.NotifyAccountBalanceChangedAsync(destAccount.Id, destAccount.Balance, destAccount.AvailableBalance);

        await _notificationService.CreateNotificationAsync(
            sourceAccount.CustomerId,
            "Transfer Sent",
            $"You sent ${request.Amount:N2} to account {destAccount.AccountNumber}. Ref: {reference}",
            NotificationType.TransactionAlert,
            cancellationToken);

        await _notificationService.CreateNotificationAsync(
            destAccount.CustomerId,
            "Funds Received",
            $"You received ${request.Amount:N2} from account {sourceAccount.AccountNumber}. Ref: {reference}",
            NotificationType.TransactionAlert,
            cancellationToken);

        return MapToDto(tx, new[] { debitEntry, creditEntry }, fraudAlerts, sourceAccount, destAccount);
    }

    public async Task<IReadOnlyList<TransactionDto>> GetAccountTransactionsAsync(Guid accountId, int limit = 50, CancellationToken cancellationToken = default)
    {
        var txs = await _txRepo.FindAsync(
            t => t.SourceAccountId == accountId || t.DestinationAccountId == accountId,
            cancellationToken);

        return txs.OrderByDescending(t => t.CreatedAt)
            .Take(limit)
            .Select(t => MapToDto(t, t.LedgerEntries, t.FraudAlerts, t.SourceAccount, t.DestinationAccount))
            .ToList();
    }

    public async Task<IReadOnlyList<TransactionDto>> GetAllTransactionsAsync(int skip = 0, int take = 50, CancellationToken cancellationToken = default)
    {
        var all = await _txRepo.GetAllAsync(cancellationToken);
        return all.OrderByDescending(t => t.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(t => MapToDto(t, t.LedgerEntries, t.FraudAlerts, t.SourceAccount, t.DestinationAccount))
            .ToList();
    }

    public async Task<TransactionDto?> GetTransactionByIdAsync(Guid transactionId, CancellationToken cancellationToken = default)
    {
        var tx = await _txRepo.GetByIdAsync(transactionId, cancellationToken);
        return tx == null ? null : MapToDto(tx, tx.LedgerEntries, tx.FraudAlerts, tx.SourceAccount, tx.DestinationAccount);
    }

    private static TransactionDto MapToDto(
        BankTransaction tx,
        IEnumerable<LedgerEntry> ledgers,
        IEnumerable<FraudAlert> alerts,
        BankAccount? src,
        BankAccount? dest)
    {
        return new TransactionDto(
            tx.Id,
            tx.ReferenceNumber,
            tx.Type,
            tx.Status,
            tx.Amount,
            tx.Fee,
            tx.Currency,
            tx.Description,
            tx.SourceAccountId,
            src?.AccountNumber ?? tx.SourceAccount?.AccountNumber,
            tx.DestinationAccountId,
            dest?.AccountNumber ?? tx.DestinationAccount?.AccountNumber,
            tx.FailureReason,
            tx.CreatedAt,
            tx.ProcessedAt,
            ledgers.Select(l => new LedgerEntryDto(
                l.Id,
                l.TransactionId,
                l.BankAccountId,
                l.AccountNumber,
                l.EntryType,
                l.Amount,
                l.BalanceAfter,
                l.Description,
                l.CreatedAt
            )).ToList(),
            alerts.Select(a => new FraudAlertDto(
                a.Id,
                a.TransactionId,
                tx.ReferenceNumber,
                a.RuleName,
                a.Severity,
                a.Status,
                a.Description,
                a.RiskScore,
                a.CreatedAt,
                a.ResolvedAt,
                a.ResolvedBy,
                a.ResolutionNotes
            )).ToList()
        );
    }
}
