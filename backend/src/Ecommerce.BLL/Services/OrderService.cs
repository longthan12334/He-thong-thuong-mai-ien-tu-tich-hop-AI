using AutoMapper;
using Ecommerce.BLL.Interfaces;
using Ecommerce.Common.DTOs;
using Ecommerce.Common.Entities;
using Ecommerce.Common.Enums;
using Ecommerce.Common.Exceptions;
using Ecommerce.DAL.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.BLL.Services;

public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public OrderService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<OrderDto>> GetOrdersAsync(OrderStatus? status = null, int? userId = null, string? role = null)
    {
        var query = _unitOfWork.Orders.Query()
            .Include(o => o.Items)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(o => o.Status == status.Value);
        }

        // Khách hàng chỉ xem đơn hàng của chính mình
        if (userId.HasValue && role == "Customer")
        {
            query = query.Where(o => o.UserId == userId.Value);
        }
        // Seller chỉ xem đơn hàng chứa sản phẩm của mình
        else if (userId.HasValue && role == "Seller")
        {
            var sellerProductIds = await _unitOfWork.Products.Query()
                .Where(p => p.SellerId == userId.Value)
                .Select(p => p.Id)
                .ToListAsync();
            query = query.Where(o => o.Items.Any(item => item.ProductId.HasValue && sellerProductIds.Contains(item.ProductId.Value)));
        }

        var orders = await query.OrderByDescending(o => o.Id).ToListAsync();
        return _mapper.Map<List<OrderDto>>(orders);
    }

    public async Task<OrderDto> GetOrderByIdAsync(int id, int? userId = null, string? role = null)
    {
        var order = await _unitOfWork.Orders.Query()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            throw new NotFoundException("Đơn hàng", id);

        // Khách hàng chỉ xem được đơn hàng của chính mình
        if (userId.HasValue && role != "Admin" && role != "Seller" && order.UserId != userId.Value)
        {
            throw new UnauthorizedException("Bạn không có quyền truy cập thông tin đơn hàng này.");
        }

        return _mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> GetOrderByCodeAsync(string orderCode)
    {
        var order = await _unitOfWork.Orders.Query()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderCode.ToLower() == orderCode.ToLower());

        if (order == null)
            throw new NotFoundException($"Không tìm thấy đơn hàng mã '{orderCode}'.");

        return _mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> CreateOrderAsync(CreateOrderDto request, int? userId = null)
    {
        if (request.Items == null || !request.Items.Any())
            throw new BadRequestException("Đơn hàng phải có ít nhất 1 sản phẩm.");

        var orderCode = $"AG-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";
        var trackingCode = $"{Random.Shared.NextInt64(100000000000, 999999999999)}";

        decimal subtotal = 0;
        var orderItems = new List<OrderItem>();

        foreach (var item in request.Items)
        {
            var product = await _unitOfWork.Products.Query()
                .Include(p => p.Variants)
                .FirstOrDefaultAsync(p => p.Id == item.ProductId);

            if (product == null)
                throw new NotFoundException("Sản phẩm trong giỏ", item.ProductId);

            // 1. Kiểm tra tồn kho sản phẩm cha - Chặn bán khống (Overselling)
            if (product.StockQuantity < item.Quantity)
            {
                throw new BadRequestException($"Sản phẩm '{product.Name}' chỉ còn {product.StockQuantity} sản phẩm trong kho, không đủ đáp ứng số lượng yêu cầu ({item.Quantity}).");
            }

            // 2. Kiểm tra và trừ tồn kho biến thể (nếu có Specs cụ thể)
            if (product.Variants != null && product.Variants.Any() && !string.IsNullOrWhiteSpace(item.Specs))
            {
                var matchedVariant = product.Variants.FirstOrDefault(v =>
                    item.Specs.Contains(v.Size, StringComparison.OrdinalIgnoreCase) ||
                    (!string.IsNullOrEmpty(v.Color) && item.Specs.Contains(v.Color, StringComparison.OrdinalIgnoreCase)));

                if (matchedVariant != null)
                {
                    if (matchedVariant.StockQuantity < item.Quantity)
                    {
                        throw new BadRequestException($"Phiên bản '{item.Specs}' của sản phẩm '{product.Name}' chỉ còn {matchedVariant.StockQuantity} sản phẩm trong kho.");
                    }
                    matchedVariant.StockQuantity -= item.Quantity;
                }
            }

            var itemPrice = product.BasePrice;
            var itemSubtotal = itemPrice * item.Quantity;
            subtotal += itemSubtotal;

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Specs = item.Specs,
                ImageUrl = product.ImageUrl,
                Price = itemPrice,
                Quantity = item.Quantity,
                Subtotal = itemSubtotal
            });

            // 3. Giảm tồn kho sản phẩm cha & cập nhật trạng thái kho
            product.StockQuantity -= item.Quantity;
            if (product.StockQuantity == 0)
                product.StockStatus = StockStatus.OutOfStock;
            else if (product.StockQuantity <= 10)
                product.StockStatus = StockStatus.LowStock;

            _unitOfWork.Products.Update(product);
        }

        var shippingCharge = subtotal > 10000000 ? 0 : 50000;
        var taxes = Math.Round(subtotal * 0.08m, 0);
        var totalAmount = subtotal + shippingCharge + taxes;

        var order = new Order
        {
            OrderCode = orderCode,
            UserId = userId,
            CustomerName = request.CustomerName,
            CustomerEmail = request.CustomerEmail,
            CustomerPhone = request.CustomerPhone,
            ShippingAddress = request.ShippingAddress,
            PaymentMethod = request.PaymentMethod,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Paid,
            Carrier = "FedEx Logistics",
            TrackingCode = trackingCode,
            EstimatedDelivery = DateTime.UtcNow.AddDays(3).ToString("dd/MM/yyyy"),
            LastUpdateLocation = "Hệ thống sàn Aethelgard Mall tiếp nhận",
            ProgressStep = 1,
            Subtotal = subtotal,
            ShippingCharge = shippingCharge,
            Taxes = taxes,
            Discount = 0,
            TotalAmount = totalAmount,
            Items = orderItems
        };

        await _unitOfWork.Orders.AddAsync(order);
        await _unitOfWork.SaveChangesAsync();

        return await GetOrderByIdAsync(order.Id);
    }

    public async Task<OrderDto> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto request, string? role = null)
    {
        if (role != null && role != "Admin" && role != "Seller")
        {
            throw new UnauthorizedException("Chỉ người bán (Seller) hoặc Quản trị viên (Admin) mới có quyền cập nhật trạng thái đơn hàng.");
        }

        var order = await _unitOfWork.Orders.Query()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            throw new NotFoundException("Đơn hàng", id);

        order.Status = request.Status;
        if (!string.IsNullOrEmpty(request.Location))
            order.LastUpdateLocation = request.Location;

        order.ProgressStep = request.Status switch
        {
            OrderStatus.Pending => 1,
            OrderStatus.Confirmed => 2,
            OrderStatus.Processing => 2,
            OrderStatus.Shipped => 3,
            OrderStatus.Delivered => 4,
            _ => order.ProgressStep
        };

        _unitOfWork.Orders.Update(order);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<OrderDto>(order);
    }
}
