using System.Security.Claims;
using BankSphere.Application.Interfaces;
using BankSphere.Domain.Entities;
using BankSphere.Domain.Enums;
using BankSphere.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankSphere.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IRepository<BankTransaction> _txRepo;
    private readonly IRepository<BankAccount> _accountRepo;
    private readonly IRepository<Customer> _customerRepo;
    private readonly IAccountService _accountService;

    public AnalyticsController(
        IRepository<BankTransaction> txRepo,
        IRepository<BankAccount> accountRepo,
        IRepository<Customer> customerRepo,
        IAccountService accountService)
    {
        _txRepo = txRepo;
        _accountRepo = accountRepo;
        _customerRepo = customerRepo;
        _accountService = accountService;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var (userId, customerId) = await GetUserAndCustomerIdsAsync();
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");

        var allTxs = await _txRepo.GetAllAsync();
        var accounts = await _accountRepo.GetAllAsync();

        if (!isAdmin && customerId.HasValue)
        {
            var myAccountIds = accounts.Where(a => a.CustomerId == customerId.Value).Select(a => a.Id).ToHashSet();
            allTxs = allTxs.Where(t => (t.SourceAccountId.HasValue && myAccountIds.Contains(t.SourceAccountId.Value)) ||
                                       (t.DestinationAccountId.HasValue && myAccountIds.Contains(t.DestinationAccountId.Value))).ToList();
            accounts = accounts.Where(a => a.CustomerId == customerId.Value).ToList();
        }

        var totalDeposits = allTxs.Where(t => t.Type == TransactionType.Deposit && t.Status == TransactionStatus.Completed).Sum(t => t.Amount);
        var totalWithdrawals = allTxs.Where(t => t.Type == TransactionType.Withdrawal && t.Status == TransactionStatus.Completed).Sum(t => t.Amount);
        var totalTransfers = allTxs.Where(t => t.Type == TransactionType.Transfer && t.Status == TransactionStatus.Completed).Sum(t => t.Amount);

        return Ok(new
        {
            totalBalance = accounts.Sum(a => a.Balance),
            totalAccounts = accounts.Count,
            totalTransactions = allTxs.Count,
            totalDeposits,
            totalWithdrawals,
            totalTransfers
        });
    }

    [HttpGet("monthly-transactions")]
    public async Task<IActionResult> GetMonthlyTransactions()
    {
        var (userId, customerId) = await GetUserAndCustomerIdsAsync();
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");

        var allTxs = await _txRepo.GetAllAsync();

        if (!isAdmin && customerId.HasValue)
        {
            var accounts = await _accountRepo.FindAsync(a => a.CustomerId == customerId.Value);
            var myAccountIds = accounts.Select(a => a.Id).ToHashSet();
            allTxs = allTxs.Where(t => (t.SourceAccountId.HasValue && myAccountIds.Contains(t.SourceAccountId.Value)) ||
                                       (t.DestinationAccountId.HasValue && myAccountIds.Contains(t.DestinationAccountId.Value))).ToList();
        }

        var months = Enumerable.Range(0, 6)
            .Select(i => DateTime.UtcNow.AddMonths(-i))
            .OrderBy(d => d)
            .ToList();

        var monthlyData = months.Select(m =>
        {
            var label = m.ToString("MMM yyyy");
            var monthTxs = allTxs.Where(t => t.CreatedAt.Year == m.Year && t.CreatedAt.Month == m.Month && t.Status == TransactionStatus.Completed).ToList();

            var inflow = monthTxs.Where(t => t.Type == TransactionType.Deposit).Sum(t => t.Amount);
            var outflow = monthTxs.Where(t => t.Type == TransactionType.Withdrawal || t.Type == TransactionType.Transfer).Sum(t => t.Amount);

            return new
            {
                month = label,
                inflow,
                outflow,
                count = monthTxs.Count
            };
        }).ToList();

        return Ok(monthlyData);
    }

    [HttpGet("spending")]
    public async Task<IActionResult> GetSpendingBreakdown()
    {
        var (userId, customerId) = await GetUserAndCustomerIdsAsync();
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");

        var allTxs = await _txRepo.GetAllAsync();

        if (!isAdmin && customerId.HasValue)
        {
            var accounts = await _accountRepo.FindAsync(a => a.CustomerId == customerId.Value);
            var myAccountIds = accounts.Select(a => a.Id).ToHashSet();
            allTxs = allTxs.Where(t => t.SourceAccountId.HasValue && myAccountIds.Contains(t.SourceAccountId.Value)).ToList();
        }

        var categorized = allTxs
            .Where(t => t.Type == TransactionType.Withdrawal || t.Type == TransactionType.Transfer)
            .GroupBy(t => string.IsNullOrWhiteSpace(t.Description) ? "General" :
                          t.Description.Contains("Wire", StringComparison.OrdinalIgnoreCase) ? "Wire & Investments" :
                          t.Description.Contains("ATM", StringComparison.OrdinalIgnoreCase) ? "Cash & ATM" :
                          t.Description.Contains("Transfer", StringComparison.OrdinalIgnoreCase) ? "Peer Transfers" :
                          "Operational")
            .Select(g => new
            {
                category = g.Key,
                amount = g.Sum(x => x.Amount),
                percentage = allTxs.Any() ? Math.Round((g.Sum(x => x.Amount) / (allTxs.Sum(x => x.Amount) > 0 ? allTxs.Sum(x => x.Amount) : 1)) * 100, 1) : 0
            })
            .OrderByDescending(c => c.amount)
            .ToList();

        return Ok(categorized);
    }

    private async Task<(Guid? userId, Guid? customerId)> GetUserAndCustomerIdsAsync()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? userId = Guid.TryParse(userIdStr, out var uid) ? uid : null;

        var custIdStr = User.FindFirst("customerId")?.Value;
        if (Guid.TryParse(custIdStr, out var cid))
        {
            return (userId, cid);
        }

        if (userId.HasValue)
        {
            var customers = await _customerRepo.FindAsync(c => c.UserId == userId.Value);
            var cust = customers.FirstOrDefault();
            return (userId, cust?.Id);
        }

        return (userId, null);
    }
}
