namespace BankSphere.Domain.Enums;

public enum TransactionType
{
    Deposit = 1,
    Withdrawal = 2,
    Transfer = 3,
    Fee = 4,
    Interest = 5
}

public enum TransactionStatus
{
    Pending = 1,
    Completed = 2,
    Failed = 3,
    Flagged = 4,
    Reversed = 5
}

public enum LedgerEntryType
{
    Debit = 1,  // Money leaving the account / balance decreases (or liability decreases)
    Credit = 2  // Money entering the account / balance increases (or liability increases)
}

public enum AccountStatus
{
    Active = 1,
    Frozen = 2,
    Closed = 3,
    Suspended = 4
}

public enum AlertSeverity
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum AlertStatus
{
    Pending = 1,
    UnderReview = 2,
    Cleared = 3,
    ConfirmedFraud = 4
}

public enum NotificationType
{
    TransactionAlert = 1,
    FraudNotice = 2,
    SecurityAlert = 3,
    SystemNotification = 4
}
