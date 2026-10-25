using Microsoft.AspNetCore.SignalR;

namespace Ecommerce.API.Hubs;

public class NotificationHub : Hub
{
    public async Task JoinSellerGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "Sellers");
    }

    public async Task JoinCustomerGroup(string customerEmail)
    {
        if (!string.IsNullOrWhiteSpace(customerEmail))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Customer_{customerEmail.ToLower()}");
        }
    }
}
