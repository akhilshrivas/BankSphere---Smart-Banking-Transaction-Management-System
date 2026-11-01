using System.Security.Claims;
using BankSphere.Application.DTOs;
using BankSphere.Application.Interfaces;
using BankSphere.Domain.Entities;
using BankSphere.Domain.Enums;
using BankSphere.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankSphere.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager")]
public class AdminController : ControllerBase
{
    private readonly IAccountService _accountService;
    private readonly ITransactionEngine _txEngine;
    private readonly IFraudDetectionEngine _fraudEngine;
    private readonly IReconciliationService _reconciliationService;
    private readonly IRepository<Customer> _customerRepo;
    private readonly IRepository<BankAccount> _accountRepo;

    public AdminController(
        IAccountService accountService,
        ITransactionEngine txEngine,
        IFraudDetectionEngine fraudEngine,
        IReconciliationService reconciliationService,
        IRepository<Customer> customerRepo,
        IRepository<BankAccount> accountRepo)
    {
        _accountService = accountService;
        _txEngine = txEngine;
        _fraudEngine = fraudEngine;
        _reconciliationService = reconciliationService;
        _customerRepo = customerRepo;
        _accountRepo = accountRepo;
    }

    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _accountService.GetAdminDashboardAsync();
        return Ok(result);
    }

    [HttpGet("customers")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCustomers()
    {
        var customers = await _customerRepo.GetAllAsync();
        var dtos = customers.Select(c => new
        {
            c.Id,
            c.CustomerNumber,
            c.UserId,
            Email = c.User?.Email,
            FullName = c.User != null ? $"{c.User.FirstName} {c.User.LastName}".Trim() : "N/A",
            c.PhoneNumber,
            c.City,
            c.Country,
            c.KycStatus,
            c.CreatedAt,
            AccountsCount = c.BankAccounts.Count,
            TotalBalance = c.BankAccounts.Sum(a => a.Balance)
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("accounts")]
    [ProducesResponseType(typeof(IReadOnlyList<AccountDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAccounts()
    {
        var accounts = await _accountRepo.GetAllAsync();
        var dtos = accounts.Select(a => new AccountDto(
            a.Id,
            a.AccountNumber,
            a.CustomerId,
            a.Customer?.User != null ? $"{a.Customer.User.FirstName} {a.Customer.User.LastName}".Trim() : "Customer",
            a.AccountTypeId,
            a.AccountType?.Name ?? "Standard Checking",
            a.Balance,
            a.AvailableBalance,
            a.Currency,
            a.Status,
            a.CreatedAt
        )).ToList();

        return Ok(dtos);
    }

    [HttpGet("transactions")]
    [ProducesResponseType(typeof(IReadOnlyList<TransactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransactions([FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var list = await _txEngine.GetAllTransactionsAsync(skip, take);
        return Ok(list);
    }

    [HttpPatch("accounts/{id:guid}/status")]
    public async Task<IActionResult> UpdateAccountStatus(Guid id, [FromBody] UpdateAccountStatusDto request)
    {
        var adminUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid.TryParse(adminUserIdStr, out var adminUserId);

        var ok = await _accountService.SetAccountStatusAsync(id, request.Status, request.Reason ?? "Administrative review", adminUserId);
        if (!ok) return NotFound(new { message = "Account not found." });

        return Ok(new { message = $"Account status updated to {request.Status}." });
    }

    [HttpGet("fraud-alerts")]
    [ProducesResponseType(typeof(IReadOnlyList<FraudAlertDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFraudAlerts()
    {
        var alerts = await _fraudEngine.GetPendingAlertsAsync();
        return Ok(alerts);
    }

    [HttpPatch("fraud-alerts/{id:guid}/review")]
    public async Task<IActionResult> ReviewFraudAlert(Guid id, [FromBody] ReviewFraudAlertDto request)
    {
        var adminName = User.FindFirst(ClaimTypes.Email)?.Value ?? "Compliance Admin";
        var success = await _fraudEngine.ReviewAlertAsync(id, request, adminName);
        if (!success) return NotFound(new { message = "Fraud alert not found." });

        return Ok(new { message = "Fraud alert status reviewed and updated successfully." });
    }

    [HttpGet("reconciliation")]
    [ProducesResponseType(typeof(SystemReconciliationReportDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> RunReconciliation()
    {
        var report = await _reconciliationService.RunFullSystemReconciliationAsync();
        return Ok(report);
    }
}
