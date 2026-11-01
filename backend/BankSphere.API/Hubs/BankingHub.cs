using Microsoft.AspNetCore.SignalR;
using BankSphere.Application.DTOs;
using BankSphere.Application.Interfaces;

namespace BankSphere.API.Hubs;

public class BankingHub : Hub
{
    public async Task JoinCustomerGroup(string customerId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Customer_{customerId}");
    }

    public async Task JoinAdminGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "AdminGroup");
    }
}

public class RealtimeNotifier : IRealtimeNotifier
{
    private readonly IHubContext<BankingHub> _hubContext;

    public RealtimeNotifier(IHubContext<BankingHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyTransactionUpdatedAsync(TransactionDto transaction)
    {
        await _hubContext.Clients.All.SendAsync("TransactionUpdated", transaction);
    }

    public async Task NotifyFraudAlertAsync(FraudAlertDto alert)
    {
        await _hubContext.Clients.Group("AdminGroup").SendAsync("FraudAlertCreated", alert);
    }

    public async Task NotifyAccountBalanceChangedAsync(Guid accountId, decimal newBalance, decimal availableBalance)
    {
        await _hubContext.Clients.All.SendAsync("AccountBalanceChanged", new
        {
            AccountId = accountId,
            Balance = newBalance,
            AvailableBalance = availableBalance
        });
    }

    public async Task SendUserNotificationAsync(Guid customerId, NotificationDto notification)
    {
        await _hubContext.Clients.Group($"Customer_{customerId}").SendAsync("ReceiveNotification", notification);
    }
}
