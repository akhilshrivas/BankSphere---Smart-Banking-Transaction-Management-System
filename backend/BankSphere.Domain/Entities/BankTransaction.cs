using BankSphere.Domain.Enums;

namespace BankSphere.Domain.Entities;

public class BankTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ReferenceNumber { get; set; } = string.Empty;
    public string? IdempotencyKey { get; set; }
    public TransactionType Type { get; set; }
    public TransactionStatus Status { get; set; } = TransactionStatus.Pending;
    public decimal Amount { get; set; }
    public decimal Fee { get; set; } = 0m;
    public string Currency { get; set; } = "USD";
    public string Description { get; set; } = string.Empty;
    
    public Guid? SourceAccountId { get; set; }
    public BankAccount? SourceAccount { get; set; }
    public Guid? DestinationAccountId { get; set; }
    public BankAccount? DestinationAccount { get; set; }

    public string? FailureReason { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? LocationCity { get; set; }
    public string? LocationCountry { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }

    // Navigation
    public ICollection<LedgerEntry> LedgerEntries { get; set; } = new List<LedgerEntry>();
    public ICollection<FraudAlert> FraudAlerts { get; set; } = new List<FraudAlert>();
}
