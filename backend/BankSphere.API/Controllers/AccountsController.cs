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
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accountService;
    private readonly IRepository<Customer> _customerRepo;
    private readonly IRepository<AccountType> _accountTypeRepo;

    public AccountsController(
        IAccountService accountService,
        IRepository<Customer> customerRepo,
        IRepository<AccountType> accountTypeRepo)
    {
        _accountService = accountService;
        _customerRepo = customerRepo;
        _accountTypeRepo = accountTypeRepo;
    }

    [HttpPost]
    [ProducesResponseType(typeof(AccountDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequestDto request)
    {
        var customerId = await GetResolvedCustomerIdAsync();
        if (!customerId.HasValue) return Unauthorized();

        // If not admin, ensure customerId belongs to authenticated user
        var isAdmin = User.IsInRole("Admin");
        var targetCustomerId = (isAdmin && request.CustomerId.HasValue) ? request.CustomerId.Value : customerId.Value;

        var accountTypes = await _accountTypeRepo.GetAllAsync();
        var targetType = accountTypes.FirstOrDefault(t => t.Id == request.AccountTypeId)
                         ?? accountTypes.FirstOrDefault();

        if (targetType == null)
            return BadRequest(new { message = "No valid account type available." });

        var accountDto = await _accountService.CreateAccountAsync(new CreateAccountDto(
            targetCustomerId,
            targetType.Id,
            request.Currency ?? "USD",
            request.InitialDeposit
        ));

        return CreatedAtAction(nameof(GetAccountById), new { id = accountDto.Id }, accountDto);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AccountDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAccounts()
    {
        var customerId = await GetResolvedCustomerIdAsync();
        if (!customerId.HasValue) return Unauthorized();

        var accounts = await _accountService.GetCustomerAccountsAsync(customerId.Value);
        return Ok(accounts);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AccountDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAccountById(Guid id)
    {
        var account = await _accountService.GetAccountByIdAsync(id);
        if (account == null) return NotFound(new { message = "Account not found." });

        // Authorization check: ensure user owns account or is admin/manager
        var customerId = await GetResolvedCustomerIdAsync();
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");
        if (!isAdmin && account.CustomerId != customerId)
        {
            return Forbid();
        }

        return Ok(account);
    }

    [HttpGet("{id:guid}/balance")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAccountBalance(Guid id)
    {
        var account = await _accountService.GetAccountByIdAsync(id);
        if (account == null) return NotFound(new { message = "Account not found." });

        var customerId = await GetResolvedCustomerIdAsync();
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");
        if (!isAdmin && account.CustomerId != customerId)
        {
            return Forbid();
        }

        return Ok(new
        {
            accountId = account.Id,
            accountNumber = account.AccountNumber,
            balance = account.Balance,
            availableBalance = account.AvailableBalance,
            currency = account.Currency,
            status = account.Status.ToString()
        });
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateAccountStatusDto request)
    {
        var adminUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid.TryParse(adminUserIdStr, out var adminUserId);

        var success = await _accountService.SetAccountStatusAsync(id, request.Status, request.Reason ?? "Administrative review", adminUserId);
        if (!success) return NotFound(new { message = "Account not found." });

        return Ok(new { message = $"Account status successfully changed to {request.Status}." });
    }

    [HttpGet("types")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAccountTypes()
    {
        var types = await _accountTypeRepo.GetAllAsync();
        return Ok(types);
    }

    private async Task<Guid?> GetResolvedCustomerIdAsync()
    {
        var custIdStr = User.FindFirst("customerId")?.Value;
        if (Guid.TryParse(custIdStr, out var customerId))
            return customerId;

        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdStr, out var userId))
        {
            var customers = await _customerRepo.FindAsync(c => c.UserId == userId);
            var cust = customers.FirstOrDefault();
            return cust?.Id;
        }

        return null;
    }
}

public record CreateAccountRequestDto(
    Guid? CustomerId,
    Guid? AccountTypeId,
    string? Currency = "USD",
    decimal InitialDeposit = 0
);

public record UpdateAccountStatusDto(
    AccountStatus Status,
    string? Reason
);
