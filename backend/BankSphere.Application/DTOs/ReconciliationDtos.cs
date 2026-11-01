namespace BankSphere.Application.DTOs;

public record AccountReconciliationDto(
    Guid AccountId,
    string AccountNumber,
    decimal CachedBalance,
    decimal AuthoritativeLedgerBalance,
    decimal TotalCredits,
    decimal TotalDebits,
    decimal Discrepancy,
    bool IsReconciled,
    DateTime CheckedAt
);

public record SystemReconciliationReportDto(
    int TotalAccountsChecked,
    int ReconciledCount,
    int DiscrepancyCount,
    decimal TotalSystemReserves,
    decimal TotalCustomerAuthoritativeBalances,
    IReadOnlyList<AccountReconciliationDto> Discrepancies,
    DateTime GeneratedAt
);
