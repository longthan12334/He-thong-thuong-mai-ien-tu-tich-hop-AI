using System.Security.Claims;
using Ecommerce.BLL.Interfaces;
using Ecommerce.Common.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    private int GetCurrentUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (int.TryParse(sub, out var id))
            return id;

        return 1; // Fallback mặc định
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<ProductDto>>> GetProducts([FromQuery] ProductFilterDto filter)
    {
        var result = await _productService.GetProductsAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetProductById(int id)
    {
        var result = await _productService.GetProductByIdAsync(id);
        return Ok(result);
    }

    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<ProductDto>> GetProductBySlug(string slug)
    {
        var result = await _productService.GetProductBySlugAsync(slug);
        return Ok(result);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        var result = await _productService.GetCategoriesAsync();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto request)
    {
        var sellerId = GetCurrentUserId();
        var result = await _productService.CreateProductAsync(request, sellerId);
        return CreatedAtAction(nameof(GetProductById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(int id, [FromBody] CreateProductDto request)
    {
        var sellerId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Admin");

        var existing = await _productService.GetProductByIdAsync(id);
        if (!isAdmin && existing.SellerId != sellerId)
        {
            return Forbid();
        }

        var result = await _productService.UpdateProductAsync(id, request);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var sellerId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Admin");

        var existing = await _productService.GetProductByIdAsync(id);
        if (!isAdmin && existing.SellerId != sellerId)
        {
            return Forbid();
        }

        var success = await _productService.DeleteProductAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}
