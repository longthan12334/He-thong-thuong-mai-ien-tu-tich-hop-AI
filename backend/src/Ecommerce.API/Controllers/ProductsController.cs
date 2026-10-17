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

    [Authorize(Roles = "Seller,Admin")]
    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        int sellerId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : 1;

        var result = await _productService.CreateProductAsync(request, sellerId);
        return CreatedAtAction(nameof(GetProductById), new { id = result.Id }, result);
    }

    [Authorize(Roles = "Seller,Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(int id, [FromBody] CreateProductDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        int? userId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;

        var result = await _productService.UpdateProductAsync(id, request, userId, roleClaim);
        return Ok(result);
    }

    [Authorize(Roles = "Seller,Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        int? userId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;

        var success = await _productService.DeleteProductAsync(id, userId, roleClaim);
        if (!success) return NotFound();
        return NoContent();
    }
}
