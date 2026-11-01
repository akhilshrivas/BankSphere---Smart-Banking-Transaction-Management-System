using BankSphere.Application.DTOs;
using BankSphere.Application.Interfaces;
using BankSphere.Domain.Entities;
using BankSphere.Domain.Enums;
using BankSphere.Domain.Interfaces;

namespace BankSphere.Application.Services;

public class AccountService : IAccountService
{
    private readonly IRepository<BankAccount> _accountRepo;
    private readonly IRepository<Customer> _customerRepo;
    private readonly IRepository<AccountType> _accountTypeRepo;
    private readonly IRepository<BankTransaction> _txRepo;
    private readonly IRepository<FraudAlert> _alertRepo;
    private readonly IRepository<Beneficiary> _beneficiaryRepo;
    private readonly IRepository<Notification> _notificationRepo;
    private readonly IRepository<AuditLog> _auditRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditService _auditService;
    private readonly IRealtimeNotifier _notifier;

    public AccountService(
        IRepository<BankAccount> accountRepo,
        IRepository<Customer> customerRepo,
        IRepository<AccountType> accountTypeRepo,
        IRepository<BankTransaction> txRepo,
        IRepository<FraudAlert> alertRepo,
        IRepository<Beneficiary> beneficiaryRepo,
        IRepository<Notification> notificationRepo,
        IRepository<AuditLog> auditRepo,
        IUnitOfWork unitOfWork,
        IAuditService auditService,
        IRealtimeNotifier notifier)
    {
        _accountRepo = accountRepo;
        _customerRepo = customerRepo;
        _accountTypeRepo = accountTypeRepo;
        _txRepo = txRepo;
        _alertRepo = alertRepo;
        _beneficiaryRepo = beneficiaryRepo;
        _notificationRepo = notificationRepo;
        _auditRepo = auditRepo;
        _unitOfWork = unitOfWork;
        _auditService = auditService;
        _notifier = notifier;
    }

    public async Task<IReadOnlyList<AccountDto>> GetCustomerAccountsAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var accounts = await _accountRepo.FindAsync(a => a.CustomerId == customerId, cancellationToken);
        return accounts.Select(MapToAccountDto).ToList();
    }

    public async Task<AccountDto?> GetAccountByIdAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var account = await _accountRepo.GetByIdAsync(accountId, cancellationToken);
        return account == null ? null : MapToAccountDto(account);
    }

    public async Task<AccountDto?> GetAccountByNumberAsync(string accountNumber, CancellationToken cancellationToken = default)
    {
        var accounts = await _accountRepo.FindAsync(a => a.AccountNumber == accountNumber, cancellationToken);
        var acc = accounts.FirstOrDefault();
        return acc == null ? null : MapToAccountDto(acc);
    }

    public async Task<AccountDto> CreateAccountAsync(CreateAccountDto request, CancellationToken cancellationToken = default)
    {
        var customer = await _customerRepo.GetByIdAsync(request.CustomerId, cancellationToken)
            ?? throw new KeyNotFoundException($"Customer {request.CustomerId} not found.");

        var accountType = await _accountTypeRepo.GetByIdAsync(request.AccountTypeId, cancellationToken)
            ?? throw new KeyNotFoundException($"Account type {request.AccountTypeId} not found.");

        var random = new Random();
        var accountNumber = "10" + random.Next(10000000, 99999999).ToString();

        var account = new BankAccount
        {
            AccountNumber = accountNumber,
            CustomerId = customer.Id,
            Customer = customer,
            AccountTypeId = accountType.Id,
            AccountType = accountType,
            Balance = request.InitialDeposit,
            AvailableBalance = request.InitialDeposit,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "USD" : request.Currency,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        await _accountRepo.AddAsync(account, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        await _auditService.LogAsync(customer.UserId, customer.User?.Email ?? "system", "CreateAccount", "BankAccount", account.Id.ToString(), $"Opened new {accountType.Name} account: {account.AccountNumber}");

        return MapToAccountDto(account);
    }

    public async Task<bool> SetAccountStatusAsync(Guid accountId, AccountStatus status, string reason, Guid adminUserId, CancellationToken cancellationToken = default)
    {
        var account = await _accountRepo.GetByIdAsync(accountId, cancellationToken);
        if (account == null) return false;

        var oldStatus = account.Status;
        account.Status = status;
        if (status == AccountStatus.Closed)
        {
            account.ClosedAt = DateTime.UtcNow;
        }

        _accountRepo.Update(account);
        await _unitOfWork.CommitAsync(cancellationToken);

        await _auditService.LogAsync(adminUserId, "Admin", $"SetAccountStatus_{status}", "BankAccount", account.Id.ToString(), $"Changed status from {oldStatus} to {status}. Reason: {reason}");

        return true;
    }

    public async Task<CustomerDashboardDto> GetCustomerDashboardAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var customer = await _customerRepo.GetByIdAsync(customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer not found.");

        var accounts = await _accountRepo.FindAsync(a => a.CustomerId == customerId, cancellationToken);
        var accountIds = accounts.Select(a => a.Id).ToHashSet();

        var allTransactions = await _txRepo.FindAsync(
            t => (t.SourceAccountId != null && accountIds.Contains(t.SourceAccountId.Value)) ||
                 (t.DestinationAccountId != null && accountIds.Contains(t.DestinationAccountId.Value)),
            cancellationToken);

        var recentTxs = allTransactions.OrderByDescending(t => t.CreatedAt).Take(10).Select(t => new TransactionDto(
            t.Id,
            t.ReferenceNumber,
            t.Type,
            t.Status,
            t.Amount,
            t.Fee,
            t.Currency,
            t.Description,
            t.SourceAccountId,
            t.SourceAccount?.AccountNumber,
            t.DestinationAccountId,
            t.DestinationAccount?.AccountNumber,
            t.FailureReason,
            t.CreatedAt,
            t.ProcessedAt,
            t.LedgerEntries.Select(l => new LedgerEntryDto(
                l.Id, l.TransactionId, l.BankAccountId, l.AccountNumber, l.EntryType, l.Amount, l.BalanceAfter, l.Description, l.CreatedAt
            )).ToList(),
            t.FraudAlerts.Select(a => new FraudAlertDto(
                a.Id, a.TransactionId, t.ReferenceNumber, a.RuleName, a.Severity, a.Status, a.Description, a.RiskScore, a.CreatedAt, a.ResolvedAt, a.ResolvedBy, a.ResolutionNotes
            )).ToList()
        )).ToList();

        var notifications = await _notificationRepo.FindAsync(n => n.CustomerId == customerId && !n.IsRead, cancellationToken);
        var beneficiaries = await _beneficiaryRepo.FindAsync(b => b.CustomerId == customerId, cancellationToken);

        var fullName = customer.User != null ? $"{customer.User.FirstName} {customer.User.LastName}".Trim() : "Valued Customer";

        return new CustomerDashboardDto(
            customer.Id,
            fullName,
            customer.CustomerNumber,
            accounts.Sum(a => a.Balance),
            accounts.Select(MapToAccountDto).ToList(),
            recentTxs,
            notifications.Select(n => new NotificationDto(n.Id, n.CustomerId, n.Title, n.Message, n.Type, n.IsRead, n.CreatedAt)).ToList(),
            beneficiaries.Select(b => new BeneficiaryDto(b.Id, b.CustomerId, b.Name, b.AccountNumber, b.BankName, b.RoutingNumber, b.Nickname, b.Email, b.IsVerified, b.CreatedAt)).ToList()
        );
    }

    public async Task<AdminDashboardDto> GetAdminDashboardAsync(CancellationToken cancellationToken = default)
    {
        var accounts = await _accountRepo.GetAllAsync(cancellationToken);
        var customers = await _customerRepo.GetAllAsync(cancellationToken);
        var allTxs = await _txRepo.GetAllAsync(cancellationToken);
        var today = DateTime.UtcNow.Date;
        var todayTxs = allTxs.Where(t => t.CreatedAt >= today).ToList();

        var alerts = await _alertRepo.GetAllAsync(cancellationToken);
        var pendingAlerts = alerts.Where(a => a.Status == AlertStatus.Pending || a.Status == AlertStatus.UnderReview).ToList();

        var recentAudits = await _auditRepo.GetAllAsync(cancellationToken);

        return new AdminDashboardDto(
            accounts.Sum(a => a.Balance),
            customers.Count,
            accounts.Count,
            todayTxs.Count,
            todayTxs.Sum(t => t.Amount),
            pendingAlerts.Count,
            pendingAlerts.Take(10).Select(a => new FraudAlertDto(
                a.Id,
                a.TransactionId,
                a.Transaction?.ReferenceNumber ?? a.TransactionId.ToString()[..8],
                a.RuleName,
                a.Severity,
                a.Status,
                a.Description,
                a.RiskScore,
                a.CreatedAt,
                a.ResolvedAt,
                a.ResolvedBy,
                a.ResolutionNotes
            )).ToList(),
            allTxs.OrderByDescending(t => t.CreatedAt).Take(10).Select(t => new TransactionDto(
                t.Id,
                t.ReferenceNumber,
                t.Type,
                t.Status,
                t.Amount,
                t.Fee,
                t.Currency,
                t.Description,
                t.SourceAccountId,
                t.SourceAccount?.AccountNumber,
                t.DestinationAccountId,
                t.DestinationAccount?.AccountNumber,
                t.FailureReason,
                t.CreatedAt,
                t.ProcessedAt,
                Array.Empty<LedgerEntryDto>(),
                Array.Empty<FraudAlertDto>()
            )).ToList(),
            recentAudits.OrderByDescending(a => a.Timestamp).Take(15).Select(a => new AuditLogDto(
                a.Id,
                a.UserId,
                a.UserEmail,
                a.Action,
                a.EntityName,
                a.EntityId,
                a.Details,
                a.IpAddress,
                a.Timestamp
            )).ToList()
        );
    }

    private static AccountDto MapToAccountDto(BankAccount a)
    {
        var custName = a.Customer?.User != null ? $"{a.Customer.User.FirstName} {a.Customer.User.LastName}".Trim() : "Customer";
        return new AccountDto(
            a.Id,
            a.AccountNumber,
            a.CustomerId,
            custName,
            a.AccountTypeId,
            a.AccountType?.Name ?? "Standard Checking",
            a.Balance,
            a.AvailableBalance,
            a.Currency,
            a.Status,
            a.CreatedAt
        );
    }
}
