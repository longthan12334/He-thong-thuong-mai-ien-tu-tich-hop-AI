using Microsoft.AspNetCore.SignalR;

namespace Ecommerce.API.Hubs;

public class NotificationHub : Hub
{
    public async Task JoinSellerGroup(int? sellerId = null)
    {
        if (sellerId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Seller_{sellerId.Value}");
        }
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
