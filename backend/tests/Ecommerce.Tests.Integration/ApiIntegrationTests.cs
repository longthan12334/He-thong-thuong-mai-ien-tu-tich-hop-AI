using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Ecommerce.Common.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace Ecommerce.Tests.Integration;

public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GenerateTestAdminToken());
    }

    private static string GenerateTestAdminToken()
    {
        var jwtKey = "AethelgardSuperSecretKey2026NguyenDucManh9999!";
        var jwtIssuer = "AethelgardMall";
        var jwtAudience = "AethelgardMallClients";
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(JwtRegisteredClaimNames.Sub, "1"),
            new Claim(JwtRegisteredClaimNames.Email, "admin@aethelgard.com"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            jwtIssuer,
            jwtAudience,
            claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [Fact]
    public async Task GetProducts_ReturnsSuccessAndSeededProducts()
    {
        // Act
        var response = await _client.GetAsync("/api/products");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResultDto<ProductDto>>();
        Assert.NotNull(result);
        Assert.True(result.TotalCount >= 20); // Có đủ 20 sản phẩm đã seed
    }

    [Fact]
    public async Task GetInventory_ReturnsSeededSummary()
    {
        // Act
        var response = await _client.GetAsync("/api/inventory");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var summary = await response.Content.ReadFromJsonAsync<InventorySummaryDto>();
        Assert.NotNull(summary);
        Assert.True(summary.TotalSku >= 20);
        Assert.True(summary.TotalStockItems > 0);
    }

    [Fact]
    public async Task GetStores_ReturnsAsianBoutiqueStores()
    {
        // Act
        var response = await _client.GetAsync("/api/stores");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var stores = await response.Content.ReadFromJsonAsync<List<StoreDto>>();
        Assert.NotNull(stores);
        Assert.NotEmpty(stores);
        Assert.Contains(stores, s => s.StoreName.Contains("Tràng Tiền"));
    }

    [Fact]
    public async Task GetIncomeStats_ReturnsMatrixAndTransactions()
    {
        // Act
        var response = await _client.GetAsync("/api/statistics/income");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var stats = await response.Content.ReadFromJsonAsync<IncomeSummaryDto>();
        Assert.NotNull(stats);
        Assert.Equal(12, stats.MonthlyMatrix.Count);
        Assert.NotEmpty(stats.RecentTransactions);
    }

    [Fact]
    public async Task SeedRun_ReturnsSuccess()
    {
        // Act
        var response = await _client.PostAsync("/api/seed/run", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
