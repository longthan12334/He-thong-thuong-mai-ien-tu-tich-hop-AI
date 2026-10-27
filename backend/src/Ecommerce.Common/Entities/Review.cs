namespace Ecommerce.Common.Entities;

public class Review : BaseEntity
{
    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public int? UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public string Comment { get; set; } = string.Empty;
    public bool IsVerifiedPurchase { get; set; } = true;
    public int HelpfulCount { get; set; } = 0;
    public string? ShopReply { get; set; }
    public DateTime? ShopReplyAt { get; set; }
}
