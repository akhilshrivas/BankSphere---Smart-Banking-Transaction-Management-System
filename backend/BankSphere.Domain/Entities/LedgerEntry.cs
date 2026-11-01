using BankSphere.Domain.Enums;

namespace BankSphere.Domain.Entities;

public class LedgerEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TransactionId { get; set; }
    public Guid? BankAccountId { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public LedgerEntryType EntryType { get; set; } // Debit or Credit
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public BankTransaction Transaction { get; set; } = null!;
    public BankAccount? BankAccount { get; set; }
}
