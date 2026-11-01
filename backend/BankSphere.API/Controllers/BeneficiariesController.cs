using System.Security.Claims;
using BankSphere.Application.DTOs;
using BankSphere.Application.Interfaces;
using BankSphere.Domain.Entities;
using BankSphere.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankSphere.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BeneficiariesController : ControllerBase
{
    private readonly IBeneficiaryService _beneficiaryService;
    private readonly IRepository<Customer> _customerRepo;

    public BeneficiariesController(IBeneficiaryService beneficiaryService, IRepository<Customer> customerRepo)
    {
        _beneficiaryService = beneficiaryService;
        _customerRepo = customerRepo;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<BeneficiaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBeneficiaries()
    {
        var customerId = await GetResolvedCustomerIdAsync();
        if (!customerId.HasValue) return Unauthorized();

        var list = await _beneficiaryService.GetBeneficiariesAsync(customerId.Value);
        return Ok(list);
    }

    [HttpPost]
    [ProducesResponseType(typeof(BeneficiaryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddBeneficiary([FromBody] CreateBeneficiaryDto request)
    {
        var customerId = await GetResolvedCustomerIdAsync();
        if (!customerId.HasValue) return Unauthorized();

        var item = await _beneficiaryService.AddBeneficiaryAsync(customerId.Value, request);
        return CreatedAtAction(nameof(GetBeneficiaries), new { id = item.Id }, item);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBeneficiary(Guid id)
    {
        var customerId = await GetResolvedCustomerIdAsync();
        if (!customerId.HasValue) return Unauthorized();

        var deleted = await _beneficiaryService.DeleteBeneficiaryAsync(id, customerId.Value);
        if (!deleted) return NotFound(new { message = "Beneficiary not found or unauthorized." });

        return Ok(new { message = "Beneficiary deleted successfully." });
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
