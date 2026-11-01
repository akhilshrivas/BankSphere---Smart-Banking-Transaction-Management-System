namespace BankSphere.Domain.Entities;

public class Beneficiary
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string BankName { get; set; } = "BankSphere";
    public string RoutingNumber { get; set; } = string.Empty;
    public string? Nickname { get; set; }
    public string? Email { get; set; }
    public bool IsVerified { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Customer Customer { get; set; } = null!;
}
