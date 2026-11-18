using System.Net;
using System.Net.Http.Json;
using Ecommerce.BLL.Interfaces;
using Ecommerce.Common.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;

namespace Ecommerce.Tests.Integration;

public class AiContractTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private WebApplicationFactory<Program> WithFakeAi() => factory.WithWebHostBuilder(builder =>
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IAIService>();
            services.AddSingleton<IAIService>(new FakeAiService());
        }));

    [Fact]
    public async Task Recommend_PreservesResponseTextAndFallbackFlag()
    {
        using var host = WithFakeAi();
        using var client = host.CreateClient();
        using var response = await client.GetAsync("/api/ai/recommend");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<OutfitRecommendationResponseDto>();
        Assert.NotNull(result);
        Assert.Equal("Fixture recommendation", result.Recommendation);
        Assert.True(result.IsFallback);
    }

    [Theory]
    [InlineData(0, HttpStatusCode.BadRequest)]
    [InlineData(999, HttpStatusCode.NotFound)]
    public async Task Recommend_RejectsInvalidOrUnknownProduct(int id, HttpStatusCode expected)
    {
        using var host = WithFakeAi();
        using var client = host.CreateClient();
        using var response = await client.GetAsync($"/api/ai/recommend?productId={id}");
        Assert.Equal(expected, response.StatusCode);
    }

    [Fact]
    public async Task Description_ValidatesNameAndReturnsStructuredFallback()
    {
        using var host = WithFakeAi();
        using var client = host.CreateClient();
        using var invalid = await client.PostAsJsonAsync("/api/ai/generate-description", new { productName = "   " });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

        using var valid = await client.PostAsJsonAsync("/api/ai/generate-description", new { productName = "Demo bag" });
        Assert.Equal(HttpStatusCode.OK, valid.StatusCode);
        var result = await valid.Content.ReadFromJsonAsync<GeneratedProductDescriptionResponseDto>();
        Assert.NotNull(result);
        Assert.Equal("Demo bag", result.Description);
        Assert.True(result.IsFallback);
    }

    [Theory]
    [InlineData("api/ai/recommend")]
    [InlineData("api/ai/generate-description")]
    public void Endpoints_UseAiRateLimiter(string route)
    {
        using var host = WithFakeAi();
        using var client = host.CreateClient();
        var endpoint = Assert.Single(host.Services.GetRequiredService<EndpointDataSource>().Endpoints
            .OfType<RouteEndpoint>()
            .Where(endpoint => string.Equals(endpoint.RoutePattern.RawText, route, StringComparison.OrdinalIgnoreCase)));
        Assert.Equal("AiLimiter", endpoint.Metadata.GetMetadata<EnableRateLimitingAttribute>()?.PolicyName);
    }

    private sealed class FakeAiService : IAIService
    {
        public Task<OutfitRecommendationResponseDto?> GenerateOutfitRecommendationAsync(
            string query, int? productId = null, CancellationToken cancellationToken = default) =>
            Task.FromResult<OutfitRecommendationResponseDto?>(productId == 999
                ? null
                : new OutfitRecommendationResponseDto("Fixture recommendation", IsFallback: true));

        public Task<GeneratedProductDescriptionResponseDto> GenerateProductDescriptionAsync(
            GenerateProductDescriptionRequestDto request, CancellationToken cancellationToken = default) =>
            Task.FromResult(new GeneratedProductDescriptionResponseDto { Description = request.ProductName, IsFallback = true });
    }
}
