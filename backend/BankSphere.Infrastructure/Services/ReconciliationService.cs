using BankSphere.Application.DTOs;
using BankSphere.Application.Interfaces;
using BankSphere.Domain.Enums;
using BankSphere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BankSphere.Infrastructure.Services;

public class ReconciliationService : IReconciliationService
{
    private readonly BankSphereDbContext _context;

    public ReconciliationService(BankSphereDbContext context)
    {
        _context = context;
    }

    public async Task<AccountReconciliationDto> ReconcileAccountAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var account = await _context.Accounts
            .Include(a => a.LedgerEntries)
            .FirstOrDefaultAsync(a => a.Id == accountId, cancellationToken)
            ?? throw new KeyNotFoundException($"Account {accountId} not found.");

        var entries = await _context.LedgerEntries
            .Where(l => l.BankAccountId == accountId)
            .ToListAsync(cancellationToken);

        var totalCredits = entries.Where(e => e.EntryType == LedgerEntryType.Credit).Sum(e => e.Amount);
        var totalDebits = entries.Where(e => e.EntryType == LedgerEntryType.Debit).Sum(e => e.Amount);
        var authoritativeBalance = totalCredits - totalDebits;
        var discrepancy = account.Balance - authoritativeBalance;
        var isReconciled = Math.Abs(discrepancy) < 0.0001m;

        return new AccountReconciliationDto(
            account.Id,
            account.AccountNumber,
            account.Balance,
            authoritativeBalance,
            totalCredits,
            totalDebits,
            discrepancy,
            isReconciled,
            DateTime.UtcNow
        );
    }

    public async Task<SystemReconciliationReportDto> RunFullSystemReconciliationAsync(CancellationToken cancellationToken = default)
    {
        var accounts = await _context.Accounts.ToListAsync(cancellationToken);
        var reconciliations = new List<AccountReconciliationDto>();

        foreach (var account in accounts)
        {
            var res = await ReconcileAccountAsync(account.Id, cancellationToken);
            reconciliations.Add(res);
        }

        var discrepancies = reconciliations.Where(r => !r.IsReconciled).ToList();
        var totalCustAuthoritative = reconciliations.Sum(r => r.AuthoritativeLedgerBalance);

        // System reserve ledger calculation
        var reserveEntries = await _context.LedgerEntries
            .Where(l => l.AccountNumber == "SYS-RESERVE-001")
            .ToListAsync(cancellationToken);

        var totalReserveDebits = reserveEntries.Where(e => e.EntryType == LedgerEntryType.Debit).Sum(e => e.Amount);
        var totalReserveCredits = reserveEntries.Where(e => e.EntryType == LedgerEntryType.Credit).Sum(e => e.Amount);
        var totalSystemReserves = totalReserveDebits - totalReserveCredits;

        return new SystemReconciliationReportDto(
            reconciliations.Count,
            reconciliations.Count - discrepancies.Count,
            discrepancies.Count,
            totalSystemReserves,
            totalCustAuthoritative,
            discrepancies,
            DateTime.UtcNow
        );
    }
}
