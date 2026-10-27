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

    [HttpGet("{id:int}/reviews")]
    public async Task<ActionResult<List<ReviewDto>>> GetReviews(int id)
    {
        var reviews = await _productService.GetProductReviewsAsync(id);
        return Ok(reviews);
    }

    [HttpPost("{id:int}/reviews")]
    public async Task<ActionResult<ReviewDto>> CreateReview(int id, [FromBody] CreateReviewDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        int? userId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;

        var review = await _productService.AddProductReviewAsync(id, request, userId);
        return CreatedAtAction(nameof(GetReviews), new { id }, review);
    }

    [Authorize(Roles = "Seller,Admin")]
    [HttpPatch("{id:int}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        int? userId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;

        var isActive = await _productService.ToggleProductStatusAsync(id, userId, roleClaim);
        return Ok(new { id, isActive, message = isActive ? "Sản phẩm đã được kích hoạt hiển thị." : "Sản phẩm đã được chuyển sang chế độ tạm ẩn (Nháp)." });
    }

    [Authorize(Roles = "Seller,Admin")]
    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadProductImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Không tìm thấy file hình ảnh tải lên." });

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".avif" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
            return BadRequest(new { message = "Định dạng file không hỗ trợ. Vui lòng chọn ảnh JPG, PNG, WebP hoặc AVIF." });

        if (file.Length > 15 * 1024 * 1024)
            return BadRequest(new { message = "Kích thước ảnh tối đa là 15MB." });

        string publicFolder = Path.Combine(Directory.GetCurrentDirectory(), "frontend", "public", "img", "products");
        if (!Directory.Exists(publicFolder))
        {
            publicFolder = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../frontend/public/img/products"));
        }
        if (!Directory.Exists(publicFolder))
        {
            Directory.CreateDirectory(publicFolder);
        }

        var fileName = $"upload-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6]}{ext}";
        var targetPath = Path.Combine(publicFolder, fileName);
        using (var stream = new FileStream(targetPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativeUrl = $"/img/products/{fileName}";
        return Ok(new { url = relativeUrl, message = "Tải ảnh sản phẩm thành công." });
    }
}