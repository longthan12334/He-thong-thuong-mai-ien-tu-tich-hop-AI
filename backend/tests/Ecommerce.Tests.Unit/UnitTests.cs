using AutoMapper;
using Ecommerce.BLL.Interfaces;
using Ecommerce.BLL.Mappings;
using Ecommerce.BLL.Services;
using Ecommerce.Common.DTOs;
using Ecommerce.Common.Entities;
using Ecommerce.Common.Enums;
using Ecommerce.Common.Exceptions;
using Ecommerce.DAL.Interfaces;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace Ecommerce.Tests.Unit;

public class ServiceUnitTests
{
    private readonly IMapper _mapper;

    public ServiceUnitTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = config.CreateMapper();
    }

    [Fact]
    public async Task GetInventorySummary_CalculatesCorrectly()
    {
        // Arrange
        var mockUow = new Mock<IUnitOfWork>();
        var products = new List<Product>
        {
            new() { Id = 1, Name = "Giày Samba", Sku = "SKU1", BasePrice = 1000000m, StockQuantity = 20, StockStatus = StockStatus.InStock, IsActive = true },
            new() { Id = 2, Name = "Áo Khoác", Sku = "SKU2", BasePrice = 2000000m, StockQuantity = 5, StockStatus = StockStatus.LowStock, IsActive = true }
        };

        var mockRepo = new Mock<IGenericRepository<Product>>();
        mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(products);
        mockUow.Setup(u => u.Products).Returns(mockRepo.Object);

        var inventoryService = new InventoryService(mockUow.Object);

        // Act
        var result = await inventoryService.GetInventorySummaryAsync();

        // Assert
        Assert.Equal(2, result.TotalSku);
        Assert.Equal(25, result.TotalStockItems);
        Assert.Equal(30000000m, result.TotalStockValue);
        Assert.Equal(1, result.LowStockAlertCount);
    }

    [Fact]
    public async Task RestockProduct_IncreasesQuantity()
    {
        // Arrange
        var mockUow = new Mock<IUnitOfWork>();
        var product = new Product { Id = 10, StockQuantity = 5, StockStatus = StockStatus.LowStock };

        mockUow.Setup(u => u.Products.GetByIdAsync(10)).ReturnsAsync(product);
        mockUow.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var inventoryService = new InventoryService(mockUow.Object);

        // Act
        var success = await inventoryService.RestockProductAsync(new RestockRequestDto { ProductId = 10, AdditionalQuantity = 20 });

        // Assert
        Assert.True(success);
        Assert.Equal(25, product.StockQuantity);
        Assert.Equal(StockStatus.InStock, product.StockStatus);
    }

    [Fact]
    public async Task AIStylist_GeneratesRecommendation()
    {
        // Arrange
        var mockUow = new Mock<IUnitOfWork>();
        var product = new Product { Id = 101, Name = "Giày Adidas Samba OG", CollectionName = "Adidas Terrace" };
        mockUow.Setup(u => u.Products.GetByIdAsync(101)).ReturnsAsync(product);

        var aiService = new AIService(mockUow.Object);

        // Act
        var result = await aiService.GenerateOutfitRecommendationAsync("phối đồ thế nào", 101);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsFallback);
        Assert.Contains("AI Fashion Stylist", result.Recommendation);
        Assert.Contains("Adidas Samba OG", result.Recommendation);
    }

    [Fact]
    public async Task LoginAsync_ThrowsUnauthorized_WhenAccountIsLocked()
    {
        // Arrange
        var mockUow = new Mock<IUnitOfWork>();
        var lockedUser = new User
        {
            Id = 99,
            Email = "locked@aethelgard.com",
            PasswordHash = AuthService.HashPassword("Password123!"),
            Role = UserRole.Customer,
            IsActive = false,
        };
        var mockUserRepo = new Mock<IGenericRepository<User>>();
        mockUserRepo
            .Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>()))
            .ReturnsAsync(new List<User> { lockedUser });
        mockUow.Setup(u => u.Users).Returns(mockUserRepo.Object);

        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "AethelgardSuperSecretKey2026NguyenDucManh9999!",
            ["Jwt:Issuer"] = "AethelgardMall",
            ["Jwt:Audience"] = "AethelgardMallClients",
        }).Build();

        var authService = new AuthService(mockUow.Object, config);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedException>(() =>
            authService.LoginAsync(new LoginRequestDto { Email = "locked@aethelgard.com", Password = "Password123!" }));
        Assert.Contains("khóa", ex.Message);
    }

    [Fact]
    public async Task GoogleLoginAsync_ThrowsBadRequest_WhenCredentialEmpty()
    {
        var mockUow = new Mock<IUnitOfWork>();
        var config = new ConfigurationBuilder().Build();
        var authService = new AuthService(mockUow.Object, config);

        await Assert.ThrowsAsync<BadRequestException>(() =>
            authService.GoogleLoginAsync(new GoogleLoginRequestDto { Credential = "" }));
    }
}
