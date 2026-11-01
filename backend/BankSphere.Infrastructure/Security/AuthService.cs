using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BankSphere.Application.DTOs;
using BankSphere.Application.Interfaces;
using BankSphere.Domain.Entities;
using BankSphere.Domain.Interfaces;
using BankSphere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BankSphere.Infrastructure.Security;

public class AuthService : IAuthService
{
    private readonly BankSphereDbContext _context;
    private readonly IConfiguration _config;
    private readonly IAuditService _auditService;

    public AuthService(BankSphereDbContext context, IConfiguration config, IAuditService auditService)
    {
        _context = context;
        _config = config;
        _auditService = auditService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var existing = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
        if (existing)
        {
            return new AuthResponseDto(false, "An account with this email already exists.");
        }

        var role = string.Equals(request.Role, "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" :
                   string.Equals(request.Role, "Manager", StringComparison.OrdinalIgnoreCase) ? "Manager" : "Customer";

        var user = new ApplicationUser
        {
            Email = request.Email.Trim().ToLowerInvariant(),
            UserName = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = PasswordHasher.HashPassword(request.Password),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        Customer? customer = null;
        if (role == "Customer")
        {
            var random = new Random();
            customer = new Customer
            {
                UserId = user.Id,
                CustomerNumber = "CUST-" + random.Next(100000, 999999),
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                City = request.City,
                Country = string.IsNullOrWhiteSpace(request.Country) ? "US" : request.Country,
                DateOfBirth = request.DateOfBirth == default ? DateTime.UtcNow.AddYears(-25) : request.DateOfBirth,
                CreatedAt = DateTime.UtcNow
            };
            user.Customer = customer;
        }

        await _context.Users.AddAsync(user, cancellationToken);
        if (customer != null)
        {
            await _context.Customers.AddAsync(customer, cancellationToken);
            
            // Auto-create a default Checking account for new customer!
            var defaultType = await _context.AccountTypes.FirstOrDefaultAsync(cancellationToken);
            if (defaultType != null)
            {
                var randAcc = new Random();
                var bankAccount = new BankAccount
                {
                    AccountNumber = "10" + randAcc.Next(10000000, 99999999).ToString(),
                    CustomerId = customer.Id,
                    AccountTypeId = defaultType.Id,
                    Balance = 1000.0000m, // Starting welcome demonstration balance
                    AvailableBalance = 1000.0000m,
                    Currency = "USD",
                    Status = Domain.Enums.AccountStatus.Active,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.Accounts.AddAsync(bankAccount, cancellationToken);

                // Initial welcome deposit ledger entries
                var welcomeTx = new BankTransaction
                {
                    ReferenceNumber = "DEP-" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
                    Type = Domain.Enums.TransactionType.Deposit,
                    Status = Domain.Enums.TransactionStatus.Completed,
                    Amount = 1000.0000m,
                    Currency = "USD",
                    Description = "Welcome bonus deposit",
                    DestinationAccountId = bankAccount.Id,
                    ProcessedAt = DateTime.UtcNow
                };
                await _context.Transactions.AddAsync(welcomeTx, cancellationToken);

                var debitReserve = new LedgerEntry
                {
                    TransactionId = welcomeTx.Id,
                    AccountNumber = "SYS-RESERVE-001",
                    EntryType = Domain.Enums.LedgerEntryType.Debit,
                    Amount = 1000.0000m,
                    BalanceAfter = 0m,
                    Description = $"BankSphere Promotional Reserve Allocation for {bankAccount.AccountNumber}"
                };

                var creditCustomer = new LedgerEntry
                {
                    TransactionId = welcomeTx.Id,
                    BankAccountId = bankAccount.Id,
                    AccountNumber = bankAccount.AccountNumber,
                    EntryType = Domain.Enums.LedgerEntryType.Credit,
                    Amount = 1000.0000m,
                    BalanceAfter = 1000.0000m,
                    Description = $"Welcome bonus credited to {bankAccount.AccountNumber}"
                };

                await _context.LedgerEntries.AddAsync(debitReserve, cancellationToken);
                await _context.LedgerEntries.AddAsync(creditCustomer, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        var (accessToken, jti, expiresAt) = GenerateJwtToken(user, customer?.Id);
        var rawRefreshToken = GenerateRefreshTokenString();
        var hashedToken = TokenHashHelper.HashToken(rawRefreshToken);

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hashedToken,
            JwtId = jti,
            IsUsed = false,
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        await _context.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(user.Id, user.Email, "Register", "ApplicationUser", user.Id.ToString(), $"Registered user as {role}");

        return new AuthResponseDto(
            true,
            "Registration successful.",
            accessToken,
            rawRefreshToken,
            expiresAt,
            new UserInfoDto(user.Id, user.Email, user.FirstName, user.LastName, user.Role, customer?.Id)
        );
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.Customer)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower(), cancellationToken);

        if (user == null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return new AuthResponseDto(false, "Invalid email or password.");
        }

        if (!user.IsActive)
        {
            return new AuthResponseDto(false, "This account is inactive. Please contact customer support.");
        }

        user.LastLoginAt = DateTime.UtcNow;

        var (accessToken, jti, expiresAt) = GenerateJwtToken(user, user.Customer?.Id);
        var rawRefreshToken = GenerateRefreshTokenString();
        var hashedToken = TokenHashHelper.HashToken(rawRefreshToken);

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hashedToken,
            JwtId = jti,
            IsUsed = false,
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        await _context.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(user.Id, user.Email, "Login", "ApplicationUser", user.Id.ToString(), "User logged in", ipAddress);

        return new AuthResponseDto(
            true,
            "Login successful.",
            accessToken,
            rawRefreshToken,
            expiresAt,
            new UserInfoDto(user.Id, user.Email, user.FirstName, user.LastName, user.Role, user.Customer?.Id)
        );
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default)
    {
        var hashedToken = TokenHashHelper.HashToken(request.RefreshToken);
        var storedToken = await _context.RefreshTokens
            .Include(r => r.User)
            .ThenInclude(u => u.Customer)
            .FirstOrDefaultAsync(r => r.TokenHash == hashedToken, cancellationToken);

        if (storedToken == null)
            return new AuthResponseDto(false, "Invalid refresh token.");

        if (storedToken.IsRevoked || storedToken.IsUsed || storedToken.ExpiresAt <= DateTime.UtcNow)
            return new AuthResponseDto(false, "Refresh token is expired or revoked.");

        // Mark old token used (Rotation)
        storedToken.IsUsed = true;

        var user = storedToken.User;
        var (accessToken, jti, expiresAt) = GenerateJwtToken(user, user.Customer?.Id);
        var newRawRefreshToken = GenerateRefreshTokenString();
        var newHashedToken = TokenHashHelper.HashToken(newRawRefreshToken);

        var newRefreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = newHashedToken,
            JwtId = jti,
            IsUsed = false,
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        await _context.RefreshTokens.AddAsync(newRefreshToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(
            true,
            "Token refreshed successfully.",
            accessToken,
            newRawRefreshToken,
            expiresAt,
            new UserInfoDto(user.Id, user.Email, user.FirstName, user.LastName, user.Role, user.Customer?.Id)
        );
    }

    public async Task<bool> RevokeTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        var hashed = TokenHashHelper.HashToken(token);
        var storedToken = await _context.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hashed, cancellationToken);
        if (storedToken == null) return false;

        storedToken.IsRevoked = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private (string token, string jti, DateTime expiresAt) GenerateJwtToken(ApplicationUser user, Guid? customerId)
    {
        var secret = _config["JwtSettings:Secret"] ?? Domain.Common.JwtSecurityConstants.DefaultSecret;
        var issuer = _config["JwtSettings:Issuer"] ?? Domain.Common.JwtSecurityConstants.DefaultIssuer;
        var audience = _config["JwtSettings:Audience"] ?? Domain.Common.JwtSecurityConstants.DefaultAudience;
        var expiryMinutes = int.TryParse(_config["JwtSettings:ExpiryMinutes"], out var exp) ? exp : Domain.Common.JwtSecurityConstants.DefaultExpiryMinutes;

        var jti = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, jti),
            new(ClaimTypes.Role, user.Role),
            new("role", user.Role),
            new("fullName", $"{user.FirstName} {user.LastName}")
        };

        if (customerId.HasValue)
        {
            claims.Add(new Claim("customerId", customerId.Value.ToString()));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var tokenDescriptor = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(tokenDescriptor), jti, expiresAt);
    }

    private static string GenerateRefreshTokenString()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
