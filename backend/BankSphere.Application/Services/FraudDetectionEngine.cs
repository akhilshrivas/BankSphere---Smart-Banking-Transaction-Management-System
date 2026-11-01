using BankSphere.Application.DTOs;
using BankSphere.Application.Interfaces;
using BankSphere.Domain.Entities;
using BankSphere.Domain.Enums;
using BankSphere.Domain.Interfaces;

namespace BankSphere.Application.Services;

public class FraudDetectionEngine : IFraudDetectionEngine
{
    private readonly IRepository<FraudAlert> _alertRepo;
    private readonly IRepository<BankTransaction> _txRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRealtimeNotifier _notifier;

    public FraudDetectionEngine(
        IRepository<FraudAlert> alertRepo,
        IRepository<BankTransaction> txRepo,
        IUnitOfWork unitOfWork,
        IRealtimeNotifier notifier)
    {
        _alertRepo = alertRepo;
        _txRepo = txRepo;
        _unitOfWork = unitOfWork;
        _notifier = notifier;
    }

    public async Task<List<FraudAlert>> EvaluateTransactionAsync(
        BankTransaction transaction,
        BankAccount sourceAccount,
        CancellationToken cancellationToken = default)
    {
        var alerts = new List<FraudAlert>();

        // Rule 1: High Value Anomaly
        if (transaction.Amount >= 50000m)
        {
            alerts.Add(new FraudAlert
            {
                TransactionId = transaction.Id,
                RuleName = "CriticalHighValueThreshold",
                Severity = AlertSeverity.Critical,
                RiskScore = 95m,
                Description = $"Transaction amount ${transaction.Amount:N2} exceeds critical threshold ($50,000.00)."
            });
        }
        else if (transaction.Amount >= 10000m)
        {
            alerts.Add(new FraudAlert
            {
                TransactionId = transaction.Id,
                RuleName = "HighValueThreshold",
                Severity = AlertSeverity.High,
                RiskScore = 75m,
                Description = $"Transaction amount ${transaction.Amount:N2} exceeds standard high-value threshold ($10,000.00)."
            });
        }

        // Rule 2: Balance Drain (> 85% of total balance drained in one transaction)
        if (sourceAccount.Balance > 0 && (transaction.Amount / sourceAccount.Balance) >= 0.85m && transaction.Amount > 2000m)
        {
            alerts.Add(new FraudAlert
            {
                TransactionId = transaction.Id,
                RuleName = "RapidBalanceDrain",
                Severity = AlertSeverity.High,
                RiskScore = 80m,
                Description = $"Single transaction exhausts {(transaction.Amount / sourceAccount.Balance) * 100:N0}% of total account balance."
            });
        }

        // Rule 3: Rapid Velocity Check (3+ transactions within last 3 minutes)
        var recentWindow = DateTime.UtcNow.AddMinutes(-3);
        var recentTransactions = await _txRepo.FindAsync(
            t => t.SourceAccountId == sourceAccount.Id && t.CreatedAt >= recentWindow,
            cancellationToken);

        if (recentTransactions.Count >= 2) // already 2, current is 3rd+
        {
            alerts.Add(new FraudAlert
            {
                TransactionId = transaction.Id,
                RuleName = "HighVelocityTransferPattern",
                Severity = AlertSeverity.High,
                RiskScore = 85m,
                Description = $"{recentTransactions.Count + 1} transactions initiated within 3 minutes on account {sourceAccount.AccountNumber}."
            });
        }

        // Rule 4: Geographic Mismatch Anomaly
        if (!string.IsNullOrWhiteSpace(transaction.LocationCountry) &&
            sourceAccount.Customer != null &&
            !string.IsNullOrWhiteSpace(sourceAccount.Customer.Country) &&
            !string.Equals(transaction.LocationCountry, sourceAccount.Customer.Country, StringComparison.OrdinalIgnoreCase))
        {
            alerts.Add(new FraudAlert
            {
                TransactionId = transaction.Id,
                RuleName = "GeographicOriginMismatch",
                Severity = AlertSeverity.Medium,
                RiskScore = 60m,
                Description = $"Transaction originating from {transaction.LocationCountry} differs from registered customer domicile ({sourceAccount.Customer.Country})."
            });
        }

        // Save alerts
        foreach (var alert in alerts)
        {
            await _alertRepo.AddAsync(alert, cancellationToken);
        }

        return alerts;
    }

    public async Task<IReadOnlyList<FraudAlertDto>> GetPendingAlertsAsync(CancellationToken cancellationToken = default)
    {
        var alerts = await _alertRepo.FindAsync(a => a.Status == AlertStatus.Pending || a.Status == AlertStatus.UnderReview, cancellationToken);
        return alerts.OrderByDescending(a => a.CreatedAt).Select(a => new FraudAlertDto(
            a.Id,
            a.TransactionId,
            a.Transaction?.ReferenceNumber ?? "TX-" + a.TransactionId.ToString()[..8].ToUpper(),
            a.RuleName,
            a.Severity,
            a.Status,
            a.Description,
            a.RiskScore,
            a.CreatedAt,
            a.ResolvedAt,
            a.ResolvedBy,
            a.ResolutionNotes
        )).ToList();
    }

    public async Task<bool> ReviewAlertAsync(Guid alertId, ReviewFraudAlertDto reviewDto, string adminName, CancellationToken cancellationToken = default)
    {
        var alert = await _alertRepo.GetByIdAsync(alertId, cancellationToken);
        if (alert == null) return false;

        alert.Status = reviewDto.Status;
        alert.ResolutionNotes = reviewDto.ResolutionNotes;
        alert.ResolvedBy = adminName;
        alert.ResolvedAt = DateTime.UtcNow;

        _alertRepo.Update(alert);
        await _unitOfWork.CommitAsync(cancellationToken);

        return true;
    }
}
