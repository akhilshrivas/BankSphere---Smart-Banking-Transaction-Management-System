using BankSphere.Domain.Enums;

namespace BankSphere.Domain.Entities;

public class FraudAlert
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TransactionId { get; set; }
    public string RuleName { get; set; } = string.Empty;
    public AlertSeverity Severity { get; set; }
    public AlertStatus Status { get; set; } = AlertStatus.Pending;
    public string Description { get; set; } = string.Empty;
    public decimal RiskScore { get; set; } // 0 - 100
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedBy { get; set; }
    public string? ResolutionNotes { get; set; }

    // Navigation
    public BankTransaction Transaction { get; set; } = null!;
}
