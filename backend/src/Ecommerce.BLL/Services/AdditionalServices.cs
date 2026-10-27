using System.Text;
using System.Text.Json;
using AutoMapper;
using Ecommerce.BLL.Interfaces;
using Ecommerce.Common.DTOs;
using Ecommerce.Common.Entities;
using Ecommerce.DAL.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Ecommerce.BLL.Services;

public class StoreService : IStoreService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public StoreService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<StoreDto>> GetAllStoresAsync(string? brand = null)
    {
        var stores = string.IsNullOrWhiteSpace(brand)
            ? await _unitOfWork.Stores.GetAllAsync()
            : await _unitOfWork.Stores.FindAsync(s => s.BrandId.ToLower() == brand.ToLower().Trim());
        return _mapper.Map<List<StoreDto>>(stores);
    }

    public async Task<StoreDto?> GetStoreByCodeAsync(string storeCode)
    {
        var store = (await _unitOfWork.Stores.FindAsync(s => s.StoreCode.ToLower() == storeCode.ToLower())).FirstOrDefault();
        return store != null ? _mapper.Map<StoreDto>(store) : null;
    }

    public async Task<StoreDto?> UpdateStoreAsync(string storeCode, UpdateStoreDto dto)
    {
        var store = (await _unitOfWork.Stores.FindAsync(s => s.StoreCode.ToLower() == storeCode.ToLower())).FirstOrDefault();
        if (store == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.StoreName)) store.StoreName = dto.StoreName;
        if (!string.IsNullOrWhiteSpace(dto.StoreType)) store.StoreType = dto.StoreType;
        if (!string.IsNullOrWhiteSpace(dto.City)) store.City = dto.City;
        if (!string.IsNullOrWhiteSpace(dto.Country)) store.Country = dto.Country;
        if (!string.IsNullOrWhiteSpace(dto.Address)) store.Address = dto.Address;
        if (!string.IsNullOrWhiteSpace(dto.Phone)) store.Phone = dto.Phone;
        if (!string.IsNullOrWhiteSpace(dto.Email)) store.Email = dto.Email;
        if (!string.IsNullOrWhiteSpace(dto.OperatingHours)) store.OperatingHours = dto.OperatingHours;
        if (!string.IsNullOrWhiteSpace(dto.ImageUrl)) store.ImageUrl = dto.ImageUrl;
        store.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Stores.Update(store);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<StoreDto>(store);
    }

    public async Task<StoreProfileDto?> GetStoreProfileAsync(string brandOrSellerId)
    {
        int? sellerId = int.TryParse(brandOrSellerId, out int sid) ? sid : null;
        string brand = brandOrSellerId.ToLower().Trim();

        // 1. Tìm thông tin User/Seller thực tế từ bảng Users
        var user = sellerId.HasValue
            ? await _unitOfWork.Users.GetByIdAsync(sellerId.Value)
            : (await _unitOfWork.Users.FindAsync(u => u.Email.ToLower().StartsWith(brand + "@") || u.FullName.ToLower().Contains(brand))).FirstOrDefault();

        int targetSellerId = user?.Id ?? (sellerId ?? 0);
        string brandName = user?.FullName ?? (char.ToUpper(brand[0]) + brand.Substring(1) + " Official Flagship");
        string emailPrefix = (user?.Email ?? brand).Split('@')[0].ToLower();

        // 2. Tính toán chỉ số sản phẩm và đánh giá thực tế 100% từ bảng Products
        var products = targetSellerId > 0
            ? await _unitOfWork.Products.FindAsync(p => p.SellerId == targetSellerId)
            : await _unitOfWork.Products.FindAsync(p => p.Name.ToLower().Contains(brand));

        var prodList = products.ToList();
        int totalProds = prodList.Count;
        double avgRating = totalProds > 0 ? Math.Round(prodList.Average(p => (double)p.Rating), 1) : 5.0;
        int totalReviews = totalProds > 0 ? prodList.Sum(p => p.ReviewCount) : 0;

        // Tính tồn kho thực tế từ bảng ProductVariants
        int totalStock = prodList.Sum(p => p.StockQuantity);
        if (totalStock == 0 && totalProds > 0)
        {
            var pIds = prodList.Select(p => p.Id).ToList();
            var variants = await _unitOfWork.ProductVariants.FindAsync(v => pIds.Contains(v.ProductId));
            totalStock = variants.Sum(v => v.StockQuantity);
        }

        // 3. Lấy danh sách Boutique thực tế từ bảng Stores trong DB
        var boutiques = (await _unitOfWork.Stores.FindAsync(s => s.BrandId.ToLower() == emailPrefix || s.BrandId.ToLower() == brand)).ToList();

        // 4. Mã viết tắt
        string brandCode = brand.Length >= 2 ? brand.Substring(0, 2).ToUpper() : brand.ToUpper();
        if (brand.Contains("gucci")) brandCode = "GG";
        else if (brand.Contains("dior")) brandCode = "CD";
        else if (brand.Contains("chanel")) brandCode = "CC";
        else if (brand.Contains("louisvuitton") || brand.Contains("vuitton")) brandCode = "LV";
        else if (brand.Contains("prada")) brandCode = "PR";
        else if (brand.Contains("balenciaga")) brandCode = "BL";
        else if (brand.Contains("adidas")) brandCode = "ADI";
        else if (brand.Contains("nike")) brandCode = "NK";

        string slogan = $"Gian hàng chính hãng {brandName} phân phối trực tiếp tại Aethelgard Mall";

        return new StoreProfileDto
        {
            SellerId = targetSellerId,
            BrandId = emailPrefix,
            BrandName = brandName,
            BrandCode = brandCode,
            Slogan = slogan,
            Rating = avgRating,
            ReviewCount = totalReviews,
            TotalProducts = totalProds,
            TotalStock = totalStock,
            BoutiqueCount = boutiques.Count,
            AvatarUrl = user?.AvatarUrl,
            CoverBannerUrl = user?.CoverBannerUrl,
            Boutiques = _mapper.Map<List<StoreDto>>(boutiques)
        };
    }
}


public class AIService : IAIService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration? _configuration;
    private readonly ILogger<AIService>? _logger;
    private readonly IMemoryCache? _cache;
    private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(15) };

    public AIService(
        IUnitOfWork unitOfWork,
        IConfiguration? configuration = null,
        ILogger<AIService>? logger = null,
        IMemoryCache? cache = null)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _logger = logger;
        _cache = cache;
    }

    public async Task<string> GenerateOutfitRecommendationAsync(string query, int? productId = null)
    {
        var normalizedQuery = (query ?? string.Empty).Trim().ToLowerInvariant();
        var cacheKey = $"ai_outfit_{productId ?? 0}_{normalizedQuery}";

        if (_cache != null && _cache.TryGetValue(cacheKey, out string? cached) && !string.IsNullOrWhiteSpace(cached))
        {
            _logger?.LogInformation("Hit AI Cache cho key '{CacheKey}'", cacheKey);
            return cached;
        }

        Product? product = null;
        if (productId.HasValue)
        {
            product = await _unitOfWork.Products.GetByIdAsync(productId.Value);
        }

        var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")
                     ?? _configuration?["Gemini:ApiKey"];
        var model = _configuration?["Gemini:Model"] ?? "gemini-3-flash-preview";

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var promptBuilder = new StringBuilder();
                promptBuilder.AppendLine("Bạn là Aethelgard AI Stylist - trợ lý cố vấn thời trang cá nhân của sàn thương mại điện tử xa xỉ Aethelgard Shopping Mall.");
                promptBuilder.AppendLine("Bạn am hiểu sâu sắc về văn hóa thời trang cao cấp (Luxury, Haute Couture, Streetwear, Smart Casual, Old Money).");
                if (product != null)
                {
                    promptBuilder.AppendLine($"Sản phẩm khách hàng đang quan tâm: '{product.Name}'.");
                    if (!string.IsNullOrEmpty(product.CollectionName)) promptBuilder.AppendLine($"- Bộ sưu tập/Thương hiệu: {product.CollectionName}");
                    promptBuilder.AppendLine($"- Giá bán: {product.BasePrice:N0} đ");
                    if (!string.IsNullOrEmpty(product.Description)) promptBuilder.AppendLine($"- Mô tả: {product.Description}");
                }

                promptBuilder.AppendLine($"Yêu cầu / Câu hỏi của khách hàng: \"{(string.IsNullOrWhiteSpace(query) ? "Tư vấn phối đồ hoàn chỉnh" : query)}\"");
                promptBuilder.AppendLine("Hướng dẫn trả lời:");
                promptBuilder.AppendLine("- Đưa ra lời tư vấn phong cách tinh tế, lịch thiệp, sang trọng, mang tính truyền cảm hứng.");
                promptBuilder.AppendLine("- Gợi ý chi tiết cách phối trang phục (áo, quần/váy), màu sắc hài hòa và phụ kiện (giày, kính, túi xách, đồng hồ) đi kèm.");
                promptBuilder.AppendLine("- Ngắn gọn trong khoảng 2-4 câu, trình bày súc tích, chuyên nghiệp bằng tiếng Việt.");

                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = promptBuilder.ToString() }
                            }
                        }
                    }
                };

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, content);
                if (response.IsSuccessStatusCode)
                {
                    var jsonStr = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(jsonStr);
                    var text = doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();

                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        var result = $"[AI Fashion Stylist]: {text.Trim()}";
                        _cache?.Set(cacheKey, result, TimeSpan.FromHours(6));
                        return result;
                    }
                }
                else
                {
                    _logger?.LogWarning("Gemini API call failed with status: {StatusCode}", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Lỗi khi gọi Google Gemini API.");
            }
        }

        // Fallback thông minh nếu không có kết nối internet hoặc API lỗi
        string fallback;
        if (product != null)
        {
            fallback = $"[AI Fashion Stylist]: Đối với sản phẩm '{product.Name}' mang phong cách {product.CollectionName ?? "Luxury"}, bạn nên phối cùng quần nỉ ống rộng dáng suông màu tối và áo khoác bomber hoặc jacket denim oversize. Hoàn thiện set đồ với kính mát gọng chữ nhật Double G để tăng nét thanh lịch, thượng lưu.";
        }
        else
        {
            fallback = "[AI Fashion Stylist]: Xu hướng phối đồ thời thượng hiện nay là phong cách High-Low kết hợp giữa giày sneaker biểu tượng (Adidas Samba OG hoặc Gucci Ace) cùng áo nỉ form rộng và phụ kiện kính râm tối giản.";
        }

        _cache?.Set(cacheKey, fallback, TimeSpan.FromHours(1));
        return fallback;
    }

    public async Task<GeneratedProductDescriptionResponseDto> GenerateProductDescriptionAsync(GenerateProductDescriptionRequestDto request)
    {
        var cacheKey = $"ai_desc_{request.ProductName.Trim().ToLowerInvariant()}_{request.Brand?.Trim().ToLowerInvariant()}_{request.CategoryName?.Trim().ToLowerInvariant()}";
        if (_cache != null && _cache.TryGetValue(cacheKey, out GeneratedProductDescriptionResponseDto? cached) && cached != null)
        {
            _logger?.LogInformation("Hit AI Cache cho mô tả sản phẩm '{Key}'", cacheKey);
            return cached;
        }

        var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")
                     ?? _configuration?["Gemini:ApiKey"];
        var model = _configuration?["Gemini:Model"] ?? "gemini-3-flash-preview";

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var promptBuilder = new StringBuilder();
                promptBuilder.AppendLine("Bạn là chuyên gia cố vấn sáng tạo nội dung và phong cách thời trang xa xỉ của sàn thương mại điện tử Aethelgard Shopping Mall.");
                promptBuilder.AppendLine("Nhiệm vụ: Hãy tạo thông tin mô tả chi tiết cho sản phẩm mới đăng bán của người bán (Seller).");
                promptBuilder.AppendLine($"- Tên sản phẩm: {request.ProductName}");
                if (!string.IsNullOrEmpty(request.CategoryName)) promptBuilder.AppendLine($"- Danh mục: {request.CategoryName}");
                if (!string.IsNullOrEmpty(request.Brand)) promptBuilder.AppendLine($"- Thương hiệu / BST: {request.Brand}");
                if (!string.IsNullOrEmpty(request.Keywords)) promptBuilder.AppendLine($"- Điểm nổi bật / Từ khóa: {request.Keywords}");
                promptBuilder.AppendLine("YÊU CẦU: Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ không kèm bất kỳ thẻ markdown fence ```json nào, định dạng như sau:");
                promptBuilder.AppendLine("{");
                promptBuilder.AppendLine("  \"seoTitle\": \"Tiêu đề sản phẩm chuẩn SEO sang trọng dưới 70 ký tự\",");
                promptBuilder.AppendLine("  \"description\": \"Đoạn văn mô tả thời trang lôi cuốn, nêu bật phom dáng, chất liệu và phong thái đẳng cấp (từ 2-3 đoạn văn tinh tế)\",");
                promptBuilder.AppendLine("  \"material\": \"Chất liệu gợi ý (VD: 100% Cotton French Terry 450 GSM hoặc Da bê Ý nguyên tấm)\",");
                promptBuilder.AppendLine("  \"careInstructions\": \"Hướng dẫn bảo quản chi tiết (VD: Giặt khô chuyên nghiệp, bảo quản nơi thoáng khí)\"");
                promptBuilder.AppendLine("}");

                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = promptBuilder.ToString() }
                            }
                        }
                    }
                };

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, content);
                if (response.IsSuccessStatusCode)
                {
                    var jsonStr = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(jsonStr);
                    var text = doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();

                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        var cleanedJson = text.Trim();
                        if (cleanedJson.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
                        {
                            cleanedJson = cleanedJson.Substring(7);
                        }
                        if (cleanedJson.StartsWith("```"))
                        {
                            cleanedJson = cleanedJson.Substring(3);
                        }
                        if (cleanedJson.EndsWith("```"))
                        {
                            cleanedJson = cleanedJson.Substring(0, cleanedJson.Length - 3);
                        }
                        cleanedJson = cleanedJson.Trim();

                        var parsed = JsonSerializer.Deserialize<GeneratedProductDescriptionResponseDto>(cleanedJson, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                        if (parsed != null && !string.IsNullOrWhiteSpace(parsed.Description))
                        {
                            _cache?.Set(cacheKey, parsed, TimeSpan.FromHours(12));
                            return parsed;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Lỗi khi gọi Gemini sinh mô tả sản phẩm.");
            }
        }

        // Fallback sang mẫu mô tả cao cấp nếu API bận
        var brand = string.IsNullOrWhiteSpace(request.Brand) ? "Aethelgard Signature" : request.Brand;
        var fallbackDto = new GeneratedProductDescriptionResponseDto
        {
            SeoTitle = $"{request.ProductName} — BST {brand} Chính Hãng",
            Description = $"Tác phẩm {request.ProductName} thuộc dòng sản phẩm cao cấp của {brand}, được chế tác tỉ mỉ nhằm tôn vinh gu thẩm mỹ độc bản của chủ nhân. Thiết kế kết hợp hài hòa giữa ngôn ngữ hình thể đương đại và phom dáng kinh điển, mang đến diện mạo tự tin và sang trọng cho mọi khoảnh khắc xuất hiện.",
            Material = "Chất liệu thượng hạng tuyển chọn theo tiêu chuẩn kiểm định quốc tế",
            CareInstructions = "Bảo quản trong túi vải chống bụi, tránh tiếp xúc nhiệt độ cao và hóa chất tẩy rửa mạnh."
        };

        _cache?.Set(cacheKey, fallbackDto, TimeSpan.FromHours(2));
        return fallbackDto;
    }
}
