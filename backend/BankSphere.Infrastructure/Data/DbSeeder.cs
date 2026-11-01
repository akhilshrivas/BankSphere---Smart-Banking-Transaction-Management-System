using BankSphere.Domain.Entities;
using BankSphere.Domain.Enums;
using BankSphere.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace BankSphere.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(BankSphereDbContext context)
    {
        // 1. Roles
        if (!await context.Roles.AnyAsync())
        {
            context.Roles.AddRange(
                new Role { Name = "Customer", Description = "Standard retail banking customer" },
                new Role { Name = "Admin", Description = "Full system and compliance administrator" },
                new Role { Name = "Manager", Description = "Operations and fraud review manager" }
            );
            await context.SaveChangesAsync();
        }

        // 2. Account Types
        if (!await context.AccountTypes.AnyAsync())
        {
            context.AccountTypes.AddRange(
                new AccountType
                {
                    Name = "Standard Checking",
                    Description = "Everyday digital checking account with zero monthly maintenance fee",
                    InterestRate = 0.0000m,
                    MinimumBalance = 0.0000m,
                    DailyTransferLimit = 15000.0000m,
                    IsActive = true
                },
                new AccountType
                {
                    Name = "High-Yield Savings",
                    Description = "High-interest savings account offering competitive daily accrued APY",
                    InterestRate = 0.0425m,
                    MinimumBalance = 100.0000m,
                    DailyTransferLimit = 25000.0000m,
                    IsActive = true
                },
                new AccountType
                {
                    Name = "Business Commercial",
                    Description = "Commercial operational account for high volume and payroll",
                    InterestRate = 0.0150m,
                    MinimumBalance = 1000.0000m,
                    DailyTransferLimit = 100000.0000m,
                    IsActive = true
                }
            );
            await context.SaveChangesAsync();
        }

        // 3. Admin & Manager Users
        if (!await context.Users.AnyAsync(u => u.Email == "admin@banksphere.com"))
        {
            var adminUser = new ApplicationUser
            {
                Email = "admin@banksphere.com",
                UserName = "admin@banksphere.com",
                PasswordHash = PasswordHasher.HashPassword("AdminPass123!"),
                FirstName = "BankSphere",
                LastName = "Administrator",
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(adminUser);
        }

        if (!await context.Users.AnyAsync(u => u.Email == "manager@banksphere.com"))
        {
            var managerUser = new ApplicationUser
            {
                Email = "manager@banksphere.com",
                UserName = "manager@banksphere.com",
                PasswordHash = PasswordHasher.HashPassword("ManagerPass123!"),
                FirstName = "Operations",
                LastName = "Manager",
                Role = "Manager",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(managerUser);
        }

        await context.SaveChangesAsync();

        // 4. Demonstration Customers & Accounts
        if (!await context.Users.AnyAsync(u => u.Email == "john.doe@banksphere.com"))
        {
            var johnUser = new ApplicationUser
            {
                Email = "john.doe@banksphere.com",
                UserName = "john.doe@banksphere.com",
                PasswordHash = PasswordHasher.HashPassword("CustomerPass123!"),
                FirstName = "John",
                LastName = "Doe",
                Role = "Customer",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var johnCustomer = new Customer
            {
                User = johnUser,
                CustomerNumber = "CUST-100201",
                PhoneNumber = "+1 (555) 234-5678",
                Address = "742 Evergreen Terrace",
                City = "Springfield",
                Country = "United States",
                DateOfBirth = new DateTime(1988, 5, 12, 0, 0, 0, DateTimeKind.Utc),
                CreatedAt = DateTime.UtcNow
            };

            johnUser.Customer = johnCustomer;
            context.Users.Add(johnUser);
            context.Customers.Add(johnCustomer);
            await context.SaveChangesAsync();

            var checkingType = await context.AccountTypes.FirstAsync(t => t.Name == "Standard Checking");
            var savingsType = await context.AccountTypes.FirstAsync(t => t.Name == "High-Yield Savings");

            // John's Checking Account
            var johnChecking = new BankAccount
            {
                AccountNumber = "1020495821",
                CustomerId = johnCustomer.Id,
                Customer = johnCustomer,
                AccountTypeId = checkingType.Id,
                AccountType = checkingType,
                Balance = 25000.0000m,
                AvailableBalance = 25000.0000m,
                Currency = "USD",
                Status = AccountStatus.Active,
                CreatedAt = DateTime.UtcNow.AddMonths(-3)
            };

            // John's Savings Account
            var johnSavings = new BankAccount
            {
                AccountNumber = "1020495822",
                CustomerId = johnCustomer.Id,
                Customer = johnCustomer,
                AccountTypeId = savingsType.Id,
                AccountType = savingsType,
                Balance = 50000.0000m,
                AvailableBalance = 50000.0000m,
                Currency = "USD",
                Status = AccountStatus.Active,
                CreatedAt = DateTime.UtcNow.AddMonths(-2)
            };

            context.Accounts.AddRange(johnChecking, johnSavings);
            await context.SaveChangesAsync();

            // Seed Initial Double-Entry Ledger for John's Checking ($25,000)
            var johnDepositTx = new BankTransaction
            {
                ReferenceNumber = "DEP-INIT-JOHNCK",
                Type = TransactionType.Deposit,
                Status = TransactionStatus.Completed,
                Amount = 25000.0000m,
                Currency = "USD",
                Description = "Initial Account Opening Deposit",
                DestinationAccountId = johnChecking.Id,
                CreatedAt = DateTime.UtcNow.AddMonths(-3),
                ProcessedAt = DateTime.UtcNow.AddMonths(-3)
            };
            context.Transactions.Add(johnDepositTx);

            context.LedgerEntries.AddRange(
                new LedgerEntry
                {
                    Transaction = johnDepositTx,
                    AccountNumber = "SYS-RESERVE-001",
                    EntryType = LedgerEntryType.Debit,
                    Amount = 25000.0000m,
                    BalanceAfter = 0m,
                    Description = "Central Reserve Cash Allocation",
                    CreatedAt = DateTime.UtcNow.AddMonths(-3)
                },
                new LedgerEntry
                {
                    Transaction = johnDepositTx,
                    BankAccountId = johnChecking.Id,
                    AccountNumber = johnChecking.AccountNumber,
                    EntryType = LedgerEntryType.Credit,
                    Amount = 25000.0000m,
                    BalanceAfter = 25000.0000m,
                    Description = "Initial Opening Credit",
                    CreatedAt = DateTime.UtcNow.AddMonths(-3)
                }
            );

            // Seed Initial Double-Entry Ledger for John's Savings ($50,000)
            var johnSavingsTx = new BankTransaction
            {
                ReferenceNumber = "DEP-INIT-JOHNSV",
                Type = TransactionType.Deposit,
                Status = TransactionStatus.Completed,
                Amount = 50000.0000m,
                Currency = "USD",
                Description = "Wire Transfer Deposit to Savings",
                DestinationAccountId = johnSavings.Id,
                CreatedAt = DateTime.UtcNow.AddMonths(-2),
                ProcessedAt = DateTime.UtcNow.AddMonths(-2)
            };
            context.Transactions.Add(johnSavingsTx);

            context.LedgerEntries.AddRange(
                new LedgerEntry
                {
                    Transaction = johnSavingsTx,
                    AccountNumber = "SYS-RESERVE-001",
                    EntryType = LedgerEntryType.Debit,
                    Amount = 50000.0000m,
                    BalanceAfter = 0m,
                    Description = "Federal Reserve Inbound Wire",
                    CreatedAt = DateTime.UtcNow.AddMonths(-2)
                },
                new LedgerEntry
                {
                    Transaction = johnSavingsTx,
                    BankAccountId = johnSavings.Id,
                    AccountNumber = johnSavings.AccountNumber,
                    EntryType = LedgerEntryType.Credit,
                    Amount = 50000.0000m,
                    BalanceAfter = 50000.0000m,
                    Description = "Wire Transfer Credited",
                    CreatedAt = DateTime.UtcNow.AddMonths(-2)
                }
            );

            // Jane Smith (Customer 2)
            var janeUser = new ApplicationUser
            {
                Email = "jane.smith@banksphere.com",
                UserName = "jane.smith@banksphere.com",
                PasswordHash = PasswordHasher.HashPassword("CustomerPass123!"),
                FirstName = "Jane",
                LastName = "Smith",
                Role = "Customer",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var janeCustomer = new Customer
            {
                User = janeUser,
                CustomerNumber = "CUST-100202",
                PhoneNumber = "+1 (555) 987-6543",
                Address = "10 Wall Street",
                City = "New York",
                Country = "United States",
                DateOfBirth = new DateTime(1992, 11, 24, 0, 0, 0, DateTimeKind.Utc),
                CreatedAt = DateTime.UtcNow
            };

            janeUser.Customer = janeCustomer;
            context.Users.Add(janeUser);
            context.Customers.Add(janeCustomer);
            await context.SaveChangesAsync();

            var janeChecking = new BankAccount
            {
                AccountNumber = "1020495830",
                CustomerId = janeCustomer.Id,
                Customer = janeCustomer,
                AccountTypeId = checkingType.Id,
                AccountType = checkingType,
                Balance = 15000.0000m,
                AvailableBalance = 15000.0000m,
                Currency = "USD",
                Status = AccountStatus.Active,
                CreatedAt = DateTime.UtcNow.AddMonths(-1)
            };
            context.Accounts.Add(janeChecking);
            await context.SaveChangesAsync();

            var janeDepositTx = new BankTransaction
            {
                ReferenceNumber = "DEP-INIT-JANECK",
                Type = TransactionType.Deposit,
                Status = TransactionStatus.Completed,
                Amount = 15000.0000m,
                Currency = "USD",
                Description = "Payroll Direct Deposit",
                DestinationAccountId = janeChecking.Id,
                CreatedAt = DateTime.UtcNow.AddMonths(-1),
                ProcessedAt = DateTime.UtcNow.AddMonths(-1)
            };
            context.Transactions.Add(janeDepositTx);

            context.LedgerEntries.AddRange(
                new LedgerEntry
                {
                    Transaction = janeDepositTx,
                    AccountNumber = "SYS-RESERVE-001",
                    EntryType = LedgerEntryType.Debit,
                    Amount = 15000.0000m,
                    BalanceAfter = 0m,
                    Description = "ACH Clearing Outflow to Jane",
                    CreatedAt = DateTime.UtcNow.AddMonths(-1)
                },
                new LedgerEntry
                {
                    Transaction = janeDepositTx,
                    BankAccountId = janeChecking.Id,
                    AccountNumber = janeChecking.AccountNumber,
                    EntryType = LedgerEntryType.Credit,
                    Amount = 15000.0000m,
                    BalanceAfter = 15000.0000m,
                    Description = "Payroll Direct Deposit Credited",
                    CreatedAt = DateTime.UtcNow.AddMonths(-1)
                }
            );

            // Add Beneficiaries for John
            context.Beneficiaries.AddRange(
                new Beneficiary
                {
                    CustomerId = johnCustomer.Id,
                    Name = "Jane Smith",
                    AccountNumber = janeChecking.AccountNumber,
                    BankName = "BankSphere",
                    RoutingNumber = "021000021",
                    Nickname = "Jane Checking",
                    Email = "jane.smith@banksphere.com",
                    IsVerified = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Beneficiary
                {
                    CustomerId = johnCustomer.Id,
                    Name = "Apex Capital Investments",
                    AccountNumber = "1098421001",
                    BankName = "JPMorgan Chase",
                    RoutingNumber = "021000021",
                    Nickname = "Apex Brokerage",
                    Email = "investments@apex.example",
                    IsVerified = true,
                    CreatedAt = DateTime.UtcNow
                }
            );

            // Add Welcome notifications
            context.Notifications.AddRange(
                new Notification
                {
                    CustomerId = johnCustomer.Id,
                    Title = "Welcome to BankSphere!",
                    Message = "Your digital high-security banking accounts have been initialized. You may now perform instant transfers.",
                    Type = NotificationType.SystemNotification,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Notification
                {
                    CustomerId = janeCustomer.Id,
                    Title = "Welcome to BankSphere!",
                    Message = "Welcome to next-generation banking. Real-time ledger accounting is active.",
                    Type = NotificationType.SystemNotification,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                }
            );

            await context.SaveChangesAsync();
        }
    }
}
