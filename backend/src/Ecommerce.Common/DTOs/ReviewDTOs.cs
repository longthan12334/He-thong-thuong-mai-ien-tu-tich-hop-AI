namespace Ecommerce.Common.DTOs;

public class ReviewDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int? UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsVerifiedPurchase { get; set; } = true;
    public int HelpfulCount { get; set; } = 0;
    public string? ShopReply { get; set; }
    public DateTime? ShopReplyAt { get; set; }
}

public class CreateReviewDto
{
    public string CustomerName { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public string Comment { get; set; } = string.Empty;
}

public class ReplyReviewDto
{
    public string Reply { get; set; } = string.Empty;
}

public class VnpayUrlRequestDto
{
    public string? ReturnUrl { get; set; }
}
