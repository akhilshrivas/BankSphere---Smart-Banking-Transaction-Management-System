using BankSphere.Domain.Enums;

namespace BankSphere.Domain.Entities;

public class BankAccount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string AccountNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public Guid AccountTypeId { get; set; }
    public decimal Balance { get; set; }
    public decimal AvailableBalance { get; set; }
    public string Currency { get; set; } = "USD";
    public AccountStatus Status { get; set; } = AccountStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    // Navigation
    public Customer Customer { get; set; } = null!;
    public AccountType AccountType { get; set; } = null!;
    public ICollection<LedgerEntry> LedgerEntries { get; set; } = new List<LedgerEntry>();
}
