using BankSphere.Domain.Enums;

namespace BankSphere.Application.DTOs;

public record AccountDto(
    Guid Id,
    string AccountNumber,
    Guid CustomerId,
    string CustomerName,
    Guid AccountTypeId,
    string AccountTypeName,
    decimal Balance,
    decimal AvailableBalance,
    string Currency,
    AccountStatus Status,
    DateTime CreatedAt
);

public record CreateAccountDto(
    Guid CustomerId,
    Guid AccountTypeId,
    string Currency,
    decimal InitialDeposit = 0
);

public record DepositRequestDto(
    Guid AccountId,
    decimal Amount,
    string? Description
);

public record WithdrawalRequestDto(
    Guid AccountId,
    decimal Amount,
    string? Description
);

public record TransferRequestDto(
    Guid SourceAccountId,
    string DestinationAccountNumber,
    decimal Amount,
    string? Description,
    string? ClientIp = null,
    string? UserAgent = null,
    string? LocationCity = null,
    string? LocationCountry = null,
    string? IdempotencyKey = null
);

public record TransactionDto(
    Guid Id,
    string ReferenceNumber,
    TransactionType Type,
    TransactionStatus Status,
    decimal Amount,
    decimal Fee,
    string Currency,
    string Description,
    Guid? SourceAccountId,
    string? SourceAccountNumber,
    Guid? DestinationAccountId,
    string? DestinationAccountNumber,
    string? FailureReason,
    DateTime CreatedAt,
    DateTime? ProcessedAt,
    IReadOnlyList<LedgerEntryDto> LedgerEntries,
    IReadOnlyList<FraudAlertDto> FraudAlerts
);

public record LedgerEntryDto(
    Guid Id,
    Guid TransactionId,
    Guid? BankAccountId,
    string AccountNumber,
    LedgerEntryType EntryType,
    decimal Amount,
    decimal BalanceAfter,
    string Description,
    DateTime CreatedAt
);

public record BeneficiaryDto(
    Guid Id,
    Guid CustomerId,
    string Name,
    string AccountNumber,
    string BankName,
    string RoutingNumber,
    string? Nickname,
    string? Email,
    bool IsVerified,
    DateTime CreatedAt
);

public record CreateBeneficiaryDto(
    string Name,
    string AccountNumber,
    string BankName,
    string? RoutingNumber,
    string? Nickname,
    string? Email
);

public record FraudAlertDto(
    Guid Id,
    Guid TransactionId,
    string ReferenceNumber,
    string RuleName,
    AlertSeverity Severity,
    AlertStatus Status,
    string Description,
    decimal RiskScore,
    DateTime CreatedAt,
    DateTime? ResolvedAt,
    string? ResolvedBy,
    string? ResolutionNotes
);

public record ReviewFraudAlertDto(
    AlertStatus Status,
    string ResolutionNotes
);

public record NotificationDto(
    Guid Id,
    Guid CustomerId,
    string Title,
    string Message,
    NotificationType Type,
    bool IsRead,
    DateTime CreatedAt
);

public record AuditLogDto(
    Guid Id,
    Guid? UserId,
    string UserEmail,
    string Action,
    string EntityName,
    string? EntityId,
    string? Details,
    string? IpAddress,
    DateTime Timestamp
);

public record CustomerDashboardDto(
    Guid CustomerId,
    string CustomerName,
    string CustomerNumber,
    decimal TotalBalance,
    IReadOnlyList<AccountDto> Accounts,
    IReadOnlyList<TransactionDto> RecentTransactions,
    IReadOnlyList<NotificationDto> UnreadNotifications,
    IReadOnlyList<BeneficiaryDto> Beneficiaries
);

public record AdminDashboardDto(
    decimal TotalSystemReserves,
    int TotalCustomers,
    int TotalAccounts,
    int TotalTransactionsToday,
    decimal VolumeToday,
    int PendingFraudAlerts,
    IReadOnlyList<FraudAlertDto> RecentAlerts,
    IReadOnlyList<TransactionDto> RecentTransactions,
    IReadOnlyList<AuditLogDto> RecentAudits
);
