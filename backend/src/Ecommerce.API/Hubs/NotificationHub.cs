using Microsoft.AspNetCore.SignalR;

namespace Ecommerce.API.Hubs;

public class NotificationHub : Hub
{
    public async Task JoinAdminGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
    }

    public async Task JoinSellerGroup(int? sellerId = null)
    {
        if (sellerId.HasValue && sellerId.Value > 0)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Seller_{sellerId.Value}");
        }
    }

    public async Task JoinCustomerGroup(string customerEmail)
    {
        if (!string.IsNullOrWhiteSpace(customerEmail))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Customer_{customerEmail.ToLower().Trim()}");
        }
    }
}
