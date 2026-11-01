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
public class CustomersController : ControllerBase
{
    private readonly IRepository<Customer> _customerRepo;
    private readonly IRepository<ApplicationUser> _userRepo;
    private readonly IAccountService _accountService;
    private readonly IUnitOfWork _unitOfWork;

    public CustomersController(
        IRepository<Customer> customerRepo,
        IRepository<ApplicationUser> userRepo,
        IAccountService accountService,
        IUnitOfWork unitOfWork)
    {
        _customerRepo = customerRepo;
        _userRepo = userRepo;
        _accountService = accountService;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(CustomerDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCurrentCustomer()
    {
        var custIdStr = User.FindFirst("customerId")?.Value;
        if (string.IsNullOrEmpty(custIdStr) || !Guid.TryParse(custIdStr, out var customerId))
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdStr, out var userId))
            {
                var customers = await _customerRepo.FindAsync(c => c.UserId == userId);
                var cust = customers.FirstOrDefault();
                if (cust != null) customerId = cust.Id;
                else return NotFound(new { message = "Customer profile not found for this account." });
            }
            else
            {
                return Unauthorized();
            }
        }

        var dashboard = await _accountService.GetCustomerDashboardAsync(customerId);
        return Ok(dashboard);
    }

    [HttpPut("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateCustomerProfileDto request)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var customers = await _customerRepo.FindAsync(c => c.UserId == userId);
        var customer = customers.FirstOrDefault();
        if (customer == null)
            return NotFound(new { message = "Customer profile not found." });

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber)) customer.PhoneNumber = request.PhoneNumber;
        if (!string.IsNullOrWhiteSpace(request.Address)) customer.Address = request.Address;
        if (!string.IsNullOrWhiteSpace(request.City)) customer.City = request.City;
        if (!string.IsNullOrWhiteSpace(request.Country)) customer.Country = request.Country;

        var user = await _userRepo.GetByIdAsync(userId);
        if (user != null)
        {
            if (!string.IsNullOrWhiteSpace(request.FirstName)) user.FirstName = request.FirstName;
            if (!string.IsNullOrWhiteSpace(request.LastName)) user.LastName = request.LastName;
            _userRepo.Update(user);
        }

        _customerRepo.Update(customer);
        await _unitOfWork.CommitAsync();

        return Ok(new { message = "Profile updated successfully." });
    }
}

public record UpdateCustomerProfileDto(
    string? FirstName,
    string? LastName,
    string? PhoneNumber,
    string? Address,
    string? City,
    string? Country
);
