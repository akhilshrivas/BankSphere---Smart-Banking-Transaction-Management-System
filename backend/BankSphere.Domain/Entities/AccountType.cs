namespace BankSphere.Domain.Entities;

public class AccountType
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty; // e.g. "Checking", "Savings", "Business"
    public string Description { get; set; } = string.Empty;
    public decimal InterestRate { get; set; }
    public decimal MinimumBalance { get; set; }
    public decimal DailyTransferLimit { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<BankAccount> BankAccounts { get; set; } = new List<BankAccount>();
}
