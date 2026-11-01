using BankSphere.Application.DTOs;
using BankSphere.Domain.Entities;
using BankSphere.Domain.Enums;

namespace BankSphere.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request, string? ipAddress = null, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default);
    Task<bool> RevokeTokenAsync(string token, CancellationToken cancellationToken = default);
}

public interface IAccountService
{
    Task<IReadOnlyList<AccountDto>> GetCustomerAccountsAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<AccountDto?> GetAccountByIdAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<AccountDto?> GetAccountByNumberAsync(string accountNumber, CancellationToken cancellationToken = default);
    Task<AccountDto> CreateAccountAsync(CreateAccountDto request, CancellationToken cancellationToken = default);
    Task<bool> SetAccountStatusAsync(Guid accountId, AccountStatus status, string reason, Guid adminUserId, CancellationToken cancellationToken = default);
    Task<CustomerDashboardDto> GetCustomerDashboardAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<AdminDashboardDto> GetAdminDashboardAsync(CancellationToken cancellationToken = default);
}

public interface ITransactionEngine
{
    Task<TransactionDto> ProcessDepositAsync(DepositRequestDto request, Guid userId, CancellationToken cancellationToken = default);
    Task<TransactionDto> ProcessWithdrawalAsync(WithdrawalRequestDto request, Guid userId, CancellationToken cancellationToken = default);
    Task<TransactionDto> ProcessTransferAsync(TransferRequestDto request, Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TransactionDto>> GetAccountTransactionsAsync(Guid accountId, int limit = 50, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TransactionDto>> GetAllTransactionsAsync(int skip = 0, int take = 50, CancellationToken cancellationToken = default);
    Task<TransactionDto?> GetTransactionByIdAsync(Guid transactionId, CancellationToken cancellationToken = default);
}

public interface IFraudDetectionEngine
{
    Task<List<FraudAlert>> EvaluateTransactionAsync(
        BankTransaction transaction,
        BankAccount sourceAccount,
        CancellationToken cancellationToken = default);
    
    Task<IReadOnlyList<FraudAlertDto>> GetPendingAlertsAsync(CancellationToken cancellationToken = default);
    Task<bool> ReviewAlertAsync(Guid alertId, ReviewFraudAlertDto reviewDto, string adminName, CancellationToken cancellationToken = default);
}

public interface IBeneficiaryService
{
    Task<IReadOnlyList<BeneficiaryDto>> GetBeneficiariesAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<BeneficiaryDto> AddBeneficiaryAsync(Guid customerId, CreateBeneficiaryDto request, CancellationToken cancellationToken = default);
    Task<bool> DeleteBeneficiaryAsync(Guid beneficiaryId, Guid customerId, CancellationToken cancellationToken = default);
}

public interface INotificationService
{
    Task<IReadOnlyList<NotificationDto>> GetNotificationsAsync(Guid customerId, bool unreadOnly = false, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken = default);
    Task CreateNotificationAsync(Guid customerId, string title, string message, NotificationType type, CancellationToken cancellationToken = default);
}

public interface IAuditService
{
    Task LogAsync(Guid? userId, string userEmail, string action, string entityName, string? entityId, string? details, string? ipAddress = null);
    Task<IReadOnlyList<AuditLogDto>> GetLogsAsync(int skip = 0, int take = 100, CancellationToken cancellationToken = default);
}

public interface IReconciliationService
{
    Task<AccountReconciliationDto> ReconcileAccountAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<SystemReconciliationReportDto> RunFullSystemReconciliationAsync(CancellationToken cancellationToken = default);
}

public interface IRealtimeNotifier
{
    Task NotifyTransactionUpdatedAsync(TransactionDto transaction);
    Task NotifyFraudAlertAsync(FraudAlertDto alert);
    Task NotifyAccountBalanceChangedAsync(Guid accountId, decimal newBalance, decimal availableBalance);
    Task SendUserNotificationAsync(Guid customerId, NotificationDto notification);
}
