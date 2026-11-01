using System.Globalization;
using System.Security.Claims;
using System.Text;
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
public class TransactionsController : ControllerBase
{
    private readonly ITransactionEngine _txEngine;
    private readonly IAccountService _accountService;
    private readonly IRepository<Customer> _customerRepo;
    private readonly IRepository<BankTransaction> _txRepo;

    public TransactionsController(
        ITransactionEngine txEngine,
        IAccountService accountService,
        IRepository<Customer> customerRepo,
        IRepository<BankTransaction> txRepo)
    {
        _txEngine = txEngine;
        _accountService = accountService;
        _customerRepo = customerRepo;
        _txRepo = txRepo;
    }

    [HttpPost("deposit")]
    [ProducesResponseType(typeof(TransactionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Deposit([FromBody] DepositRequestDto request)
    {
        var (userId, customerId) = await GetUserAndCustomerIdsAsync();
        if (!userId.HasValue) return Unauthorized();

        // Validate account ownership unless admin
        var account = await _accountService.GetAccountByIdAsync(request.AccountId);
        if (account == null) return NotFound(new { message = "Account not found." });

        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");
        if (!isAdmin && account.CustomerId != customerId)
        {
            return Forbid();
        }

        var result = await _txEngine.ProcessDepositAsync(request, userId.Value);
        return Ok(result);
    }

    [HttpPost("withdraw")]
    [ProducesResponseType(typeof(TransactionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawalRequestDto request)
    {
        var (userId, customerId) = await GetUserAndCustomerIdsAsync();
        if (!userId.HasValue) return Unauthorized();

        var account = await _accountService.GetAccountByIdAsync(request.AccountId);
        if (account == null) return NotFound(new { message = "Account not found." });

        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");
        if (!isAdmin && account.CustomerId != customerId)
        {
            return Forbid();
        }

        var result = await _txEngine.ProcessWithdrawalAsync(request, userId.Value);
        return Ok(result);
    }

    [HttpPost("transfer")]
    [ProducesResponseType(typeof(TransactionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Transfer([FromBody] TransferRequestDto request)
    {
        var (userId, customerId) = await GetUserAndCustomerIdsAsync();
        if (!userId.HasValue) return Unauthorized();

        // 1. Check idempotency key from header or payload
        var idempotencyKey = Request.Headers["X-Idempotency-Key"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(idempotencyKey))
        {
            var existingTxs = await _txRepo.FindAsync(t => t.IdempotencyKey == idempotencyKey);
            var existing = existingTxs.FirstOrDefault();
            if (existing != null)
            {
                var existingDto = await _txEngine.GetTransactionByIdAsync(existing.Id);
                return Ok(existingDto);
            }
        }

        // 2. Validate source account ownership
        var sourceAccount = await _accountService.GetAccountByIdAsync(request.SourceAccountId);
        if (sourceAccount == null) return NotFound(new { message = "Source account not found." });

        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");
        if (!isAdmin && sourceAccount.CustomerId != customerId)
        {
            return Forbid();
        }

        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var enrichedRequest = request with
        {
            ClientIp = clientIp,
            UserAgent = userAgent,
            IdempotencyKey = idempotencyKey
        };

        var result = await _txEngine.ProcessTransferAsync(enrichedRequest, userId.Value);

        return Ok(result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TransactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] Guid? accountId,
        [FromQuery] string? search,
        [FromQuery] TransactionType? type,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (userId, customerId) = await GetUserAndCustomerIdsAsync();
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");

        IReadOnlyList<TransactionDto> txs;

        if (accountId.HasValue)
        {
            var account = await _accountService.GetAccountByIdAsync(accountId.Value);
            if (account == null) return NotFound(new { message = "Account not found." });

            if (!isAdmin && account.CustomerId != customerId)
            {
                return Forbid();
            }

            txs = await _txEngine.GetAccountTransactionsAsync(accountId.Value, 500);
        }
        else if (isAdmin)
        {
            txs = await _txEngine.GetAllTransactionsAsync(0, 500);
        }
        else if (customerId.HasValue)
        {
            var accounts = await _accountService.GetCustomerAccountsAsync(customerId.Value);
            var all = new List<TransactionDto>();
            foreach (var acc in accounts)
            {
                var accTxs = await _txEngine.GetAccountTransactionsAsync(acc.Id, 200);
                all.AddRange(accTxs);
            }
            txs = all.DistinctBy(t => t.Id).OrderByDescending(t => t.CreatedAt).ToList();
        }
        else
        {
            return Unauthorized();
        }

        // Filtering
        var query = txs.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(t => t.ReferenceNumber.Contains(search, StringComparison.OrdinalIgnoreCase)
                                  || (t.Description != null && t.Description.Contains(search, StringComparison.OrdinalIgnoreCase)));
        }

        if (type.HasValue)
        {
            query = query.Where(t => t.Type == type.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(t => t.CreatedAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(t => t.CreatedAt <= endDate.Value);
        }

        var totalItems = query.Count();
        var pagedItems = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        Response.Headers.Append("X-Total-Count", totalItems.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        return Ok(pagedItems);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TransactionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTransactionById(Guid id)
    {
        var tx = await _txEngine.GetTransactionByIdAsync(id);
        if (tx == null) return NotFound(new { message = "Transaction not found." });

        var (userId, customerId) = await GetUserAndCustomerIdsAsync();
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");

        if (!isAdmin && customerId.HasValue)
        {
            var accounts = await _accountService.GetCustomerAccountsAsync(customerId.Value);
            var accountIds = accounts.Select(a => a.Id).ToHashSet();
            bool hasAccess = (tx.SourceAccountId.HasValue && accountIds.Contains(tx.SourceAccountId.Value)) ||
                             (tx.DestinationAccountId.HasValue && accountIds.Contains(tx.DestinationAccountId.Value));

            if (!hasAccess) return Forbid();
        }

        return Ok(tx);
    }

    [HttpGet("statement")]
    [Produces("text/csv")]
    public async Task<IActionResult> DownloadStatement(
        [FromQuery] Guid accountId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var (userId, customerId) = await GetUserAndCustomerIdsAsync();
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");

        var account = await _accountService.GetAccountByIdAsync(accountId);
        if (account == null) return NotFound(new { message = "Account not found." });

        if (!isAdmin && account.CustomerId != customerId) return Forbid();

        var txs = await _txEngine.GetAccountTransactionsAsync(accountId, 1000);

        if (startDate.HasValue) txs = txs.Where(t => t.CreatedAt >= startDate.Value).ToList();
        if (endDate.HasValue) txs = txs.Where(t => t.CreatedAt <= endDate.Value).ToList();

        var sb = new StringBuilder();
        sb.AppendLine("Date (UTC),Reference Number,Type,Amount,Currency,Status,Source Account,Destination Account,Description");

        foreach (var t in txs.OrderBy(t => t.CreatedAt))
        {
            var line = string.Format(
                CultureInfo.InvariantCulture,
                "\"{0:yyyy-MM-dd HH:mm:ss}\",\"{1}\",\"{2}\",\"{3:F4}\",\"{4}\",\"{5}\",\"{6}\",\"{7}\",\"{8}\"",
                t.CreatedAt,
                t.ReferenceNumber,
                t.Type,
                t.Amount,
                t.Currency,
                t.Status,
                t.SourceAccountNumber ?? "N/A",
                t.DestinationAccountNumber ?? "N/A",
                t.Description.Replace("\"", "\"\"")
            );
            sb.AppendLine(line);
        }

        var fileName = $"Statement_{account.AccountNumber}_{DateTime.UtcNow:yyyyMMdd}.csv";
        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", fileName);
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
