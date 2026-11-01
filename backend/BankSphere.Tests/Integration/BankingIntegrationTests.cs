using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using BankSphere.Application.DTOs;
using BankSphere.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BankSphere.Tests.Integration;

public class BankingIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public BankingIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:SqliteConnection", "Data Source=BankSphereIntegration.db");
            builder.UseSetting("DatabaseProvider", "Sqlite");
        });

        // Ensure database is created and seeded
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BankSphereDbContext>();
        db.Database.EnsureCreated();
        DbSeeder.SeedAsync(db).GetAwaiter().GetResult();
    }

    [Fact]
    public async Task CustomerRegistration_ValidData_ReturnsSuccessAndTokens()
    {
        // Arrange
        var client = _factory.CreateClient();
        var email = $"alice_{Guid.NewGuid():N}@banksphere.com";
        var regRequest = new RegisterRequestDto(
            Email: email,
            Password: "SecurePassword123!",
            FirstName: "Alice",
            LastName: "Wonder",
            PhoneNumber: "555-0199",
            Address: "123 Test St",
            City: "Metropolis",
            Country: "US",
            DateOfBirth: new DateTime(1995, 3, 15)
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", regRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var authResult = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authResult);
        Assert.True(authResult.Success);
        Assert.NotNull(authResult.AccessToken);
        Assert.NotNull(authResult.RefreshToken);
        Assert.NotNull(authResult.User);
        Assert.Equal("Customer", authResult.User.Role);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsJwtToken()
    {
        // Arrange
        var client = _factory.CreateClient();
        var email = $"bob_{Guid.NewGuid():N}@banksphere.com";
        var password = "ValidPassword123!";

        // Register first
        var reg = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto(
            email, password, "Bob", "Builder", "555-0123", "456 Oak", "Springfield", "US", new DateTime(1990, 1, 1)
        ));
        Assert.Equal(HttpStatusCode.OK, reg.StatusCode);

        // Act
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto(email, password));

        // Assert
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var authResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authResult);
        Assert.True(authResult.Success);
        Assert.NotEmpty(authResult.AccessToken!);
    }

    [Fact]
    public async Task Login_InvalidPassword_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();
        var email = $"charlie_{Guid.NewGuid():N}@banksphere.com";

        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto(
            email, "CorrectPass123!", "Charlie", "Brown", "555-0124", "789 Pine", "Gotham", "US", new DateTime(1992, 2, 2)
        ));

        // Act
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto(email, "WrongPassword!"));

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, loginResponse.StatusCode);
        var authResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authResult);
        Assert.False(authResult.Success);
    }

    [Fact]
    public async Task CustomerRole_AccessingAdminDashboard_ReturnsForbidden()
    {
        // Arrange
        var client = _factory.CreateClient();
        var email = $"cust_auth_{Guid.NewGuid():N}@banksphere.com";

        var regRes = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto(
            email, "Password123!", "Regular", "Customer", "555-0125", "101 Elm", "Star City", "US", new DateTime(1993, 3, 3)
        ));
        var auth = await regRes.Content.ReadFromJsonAsync<AuthResponseDto>();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        // Act - Attempt to access admin dashboard
        var response = await client.GetAsync("/api/admin/dashboard");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AdminRole_AccessingAdminDashboard_ReturnsSuccess()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // Login with seeded admin credentials: admin@banksphere.com / AdminPass123!
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("admin@banksphere.com", "AdminPass123!"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        // Act
        var response = await client.GetAsync("/api/admin/dashboard");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dashboard = await response.Content.ReadFromJsonAsync<AdminDashboardDto>();
        Assert.NotNull(dashboard);
        Assert.True(dashboard.TotalAccounts > 0);
    }

    [Fact]
    public async Task DuplicateIdempotencyKey_ReturnsSameTransactionWithoutDuplicateCharge()
    {
        // Arrange
        var client = _factory.CreateClient();
        var email = $"idemp_{Guid.NewGuid():N}@banksphere.com";

        var regRes = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto(
            email, "Password123!", "Dave", "Miller", "555-0127", "202 Birch", "Coast City", "US", new DateTime(1994, 4, 4)
        ));
        var auth = await regRes.Content.ReadFromJsonAsync<AuthResponseDto>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        // Retrieve the auto-created checking account
        var accResponse = await client.GetAsync("/api/accounts");
        var accounts = await accResponse.Content.ReadFromJsonAsync<List<AccountDto>>();
        Assert.NotNull(accounts);
        var sourceAcc = accounts.First();

        // Create destination account
        var destEmail = $"dest_{Guid.NewGuid():N}@banksphere.com";
        var destReg = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto(
            destEmail, "Password123!", "Eve", "Dest", "555-0128", "303 Maple", "Coast City", "US", new DateTime(1996, 6, 6)
        ));
        var destAuth = await destReg.Content.ReadFromJsonAsync<AuthResponseDto>();
        var destClient = _factory.CreateClient();
        destClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", destAuth!.AccessToken);
        var destAccs = await destClient.GetFromJsonAsync<List<AccountDto>>("/api/accounts");
        var destAcc = destAccs!.First();

        var idempotencyKey = "IDEMP-KEY-" + Guid.NewGuid();
        var transferDto = new TransferRequestDto(sourceAcc.Id, destAcc.AccountNumber, 50m, "Test Idempotent Transfer");

        var requestMessage1 = new HttpRequestMessage(HttpMethod.Post, "/api/transactions/transfer")
        {
            Content = JsonContent.Create(transferDto)
        };
        requestMessage1.Headers.Add("X-Idempotency-Key", idempotencyKey);

        // Act 1: First request
        var response1 = await client.SendAsync(requestMessage1);
        Assert.Equal(HttpStatusCode.OK, response1.StatusCode);
        var txResult1 = await response1.Content.ReadFromJsonAsync<TransactionDto>();
        Assert.NotNull(txResult1);

        // Act 2: Second duplicate request with exact same idempotency key
        var requestMessage2 = new HttpRequestMessage(HttpMethod.Post, "/api/transactions/transfer")
        {
            Content = JsonContent.Create(transferDto)
        };
        requestMessage2.Headers.Add("X-Idempotency-Key", idempotencyKey);

        var response2 = await client.SendAsync(requestMessage2);

        // Assert: Second request returns same transaction and does not double charge
        Assert.Equal(HttpStatusCode.OK, response2.StatusCode);
        var txResult2 = await response2.Content.ReadFromJsonAsync<TransactionDto>();
        Assert.NotNull(txResult2);
        Assert.Equal(txResult1.Id, txResult2.Id);
        Assert.Equal(txResult1.ReferenceNumber, txResult2.ReferenceNumber);

        // Verify balance was only deducted once ($1000 - $50 = $950)
        var balanceRes = await client.GetFromJsonAsync<AccountDto>($"/api/accounts/{sourceAcc.Id}");
        Assert.NotNull(balanceRes);
        Assert.Equal(950m, balanceRes.Balance);
    }
}
