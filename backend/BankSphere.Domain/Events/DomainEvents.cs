namespace BankSphere.Domain.Events;

public interface IDomainEvent
{
    DateTime OccurredOn { get; }
}

public record TransactionCreatedEvent(
    Guid TransactionId,
    string ReferenceNumber,
    decimal Amount,
    string Currency,
    Guid? SourceAccountId,
    Guid? DestinationAccountId,
    DateTime OccurredOn
) : IDomainEvent;

public record FraudAlertTriggeredEvent(
    Guid AlertId,
    Guid TransactionId,
    string RuleName,
    string Severity,
    string Description,
    DateTime OccurredOn
) : IDomainEvent;

public record AccountFrozenEvent(
    Guid AccountId,
    string AccountNumber,
    string Reason,
    DateTime OccurredOn
) : IDomainEvent;
