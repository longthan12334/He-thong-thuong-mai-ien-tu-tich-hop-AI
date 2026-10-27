using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Ecommerce.Common.Entities;
using Ecommerce.Common.Enums;
using Ecommerce.DAL.Context;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.DAL.Seed;

public static class DatabaseSeeder
{
    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await EnsurePerformanceOptimizationsAsync(context);
        await EnsureReviewsTableAsync(context);
        await EnsureAdminColumnsAsync(context);

        bool hasUsers = await context.Users.AnyAsync();
        bool hasProducts = await context.Products.AnyAsync();

        if (hasUsers && hasProducts)
        {
            try
            {
                if (!await context.Reviews.AnyAsync())
                {
                    await SeedReviewsAsync(context);
                }
            }
            catch
            {
                // Bá» qua náº¿u báº£ng reviews gáº·p váº¥n Ä‘á»
            }
            return;
        }

        // Náº¿u chÆ°a cÃ³ dá»¯ liá»‡u má»›i tiáº¿p tá»¥c bÃªn dÆ°á»›i
        await context.Database.MigrateAsync();

        // ==========================================
        // 1. Náº P NGÆ¯á»œI DÃ™NG (23 tÃ i khoáº£n)
        // ==========================================
        if (!await context.Users.AnyAsync())
        {
            var defaultPwdHash = HashPassword("Password123@");
            var users = new List<User>
            {
                new User { FullName = "Aethelgard Admin", Email = "admin@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Admin, PhoneNumber = "+84 901 000 001", AvatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", IsEmailVerified = true },
                new User { FullName = "Esther Howard", Email = "esther.howard@example.com", PasswordHash = defaultPwdHash, Role = UserRole.Customer, PhoneNumber = "+84 902 345 678", AvatarUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400", IsEmailVerified = true },
                new User { FullName = "Gucci Official", Email = "gucci@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 005 888", AvatarUrl = "/img/brands/gucci/gucci-jackie-1961-mini.jpg", IsEmailVerified = true },
                new User { FullName = "Christian Dior Official", Email = "dior@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 004 888", AvatarUrl = "/img/brands/dior/lady-dior-medium-cannage.jpg", IsEmailVerified = true },
                new User { FullName = "Adidas Official", Email = "adidas@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 006 888", AvatarUrl = "/img/brands/adidas/adidas-samba-og-classic.jpg", IsEmailVerified = true },
                new User { FullName = "Louis Vuitton Official", Email = "louisvuitton@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 012 888", AvatarUrl = "/img/brands/louisvuitton/lv-speedy-bandouliere-25.jpg", IsEmailVerified = true },
                new User { FullName = "Nike Official", Email = "nike@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 004 888", AvatarUrl = "/img/brands/nike/nike-air-force-1-white.jpg", IsEmailVerified = true },
                new User { FullName = "Chanel Official", Email = "chanel@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 006 888", AvatarUrl = "/img/brands/chanel/chanel-classic-flap-bag.jpg", IsEmailVerified = true },
                new User { FullName = "Prada Official", Email = "prada@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 005 888", AvatarUrl = "/img/brands/prada/prada-re-edition-2005-nylon.jpg", IsEmailVerified = true },
                new User { FullName = "Balenciaga Official", Email = "balenciaga@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 010 888", AvatarUrl = "/img/brands/balenciaga/balenciaga-le-city-medium-bag.jpg", IsEmailVerified = true },
                new User { FullName = "HermÃ¨s Official", Email = "hermes@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 006 888", AvatarUrl = "/img/brands/hermes/hermes-birkin-30-togo-gold.jpg", IsEmailVerified = true },
                new User { FullName = "Versace Official", Email = "versace@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 007 888", AvatarUrl = "/img/brands/versace/versace-la-medusa-handbag.jpg", IsEmailVerified = true },
                new User { FullName = "Burberry Official", Email = "burberry@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 008 888", AvatarUrl = "/img/brands/burberry/burberry-kensington-trench-coat.jpg", IsEmailVerified = true },
                new User { FullName = "Saint Laurent Official", Email = "saintlaurent@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 012 888", AvatarUrl = "/img/brands/saintlaurent/saintlaurent-loulou-medium-bag.jpg", IsEmailVerified = true },
                new User { FullName = "Fendi Official", Email = "fendi@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 005 888", AvatarUrl = "/img/brands/fendi/fendi-baguette-medium-ff-bag.jpg", IsEmailVerified = true },
                new User { FullName = "Bottega Veneta Official", Email = "bottegaveneta@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 013 888", AvatarUrl = "/img/brands/bottegaveneta/bottegaveneta-the-pouch-clutch.jpg", IsEmailVerified = true },
                new User { FullName = "Off-White Official", Email = "offwhite@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 008 888", AvatarUrl = "/img/brands/offwhite/offwhite-jitney-28-top-handle.jpg", IsEmailVerified = true },
                new User { FullName = "Puma Official", Email = "puma@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 004 888", AvatarUrl = "/img/brands/puma/puma-suede-classic-xxi.jpg", IsEmailVerified = true },
                new User { FullName = "Zara Official", Email = "zara@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 004 888", AvatarUrl = "/img/brands/zara/zara-tailored-double-breasted-blazer.jpg", IsEmailVerified = true },
                new User { FullName = "Uniqlo Official", Email = "uniqlo@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 006 888", AvatarUrl = "/img/brands/uniqlo/uniqlo-ultra-light-down-jacket.jpg", IsEmailVerified = true },
                new User { FullName = "Calvin Klein Official", Email = "calvinklein@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 011 888", AvatarUrl = "/img/brands/calvinklein/calvinklein-modern-cotton-bralette.jpg", IsEmailVerified = true },
                new User { FullName = "Tommy Hilfiger Official", Email = "tommyhilfiger@gmail.com", PasswordHash = defaultPwdHash, Role = UserRole.Seller, PhoneNumber = "+84 912 013 888", AvatarUrl = "/img/brands/tommyhilfiger/tommyhilfiger-classic-oxford-shirt.jpg", IsEmailVerified = true },
            };
            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();
        }

        // ==========================================
        // 2. Náº P DANH Má»¤C (4 danh má»¥c)
        // ==========================================
        if (!await context.Categories.AnyAsync())
        {
            var categories = new List<Category>
            {
                new Category { Name = "GiÃ y Sneaker & Thá»ƒ Thao", Slug = "giay-sneaker-the-thao", Description = "Bá»™ sÆ°u táº­p giÃ y sneaker hÃ ng hiá»‡u chÃ­nh hÃ£ng tá»« Nike, Adidas, Gucci, Balenciaga" },
                new Category { Name = "Thá»i Trang Streetwear & Ão KhoÃ¡c", Slug = "thoi-trang-streetwear-ao-khoac", Description = "Ão khoÃ¡c, hoodie, jacket phong cÃ¡ch hiá»‡n Ä‘áº¡i vÃ  sÃ n diá»…n quá»‘c táº¿" },
                new Category { Name = "Quáº§n & Phá»¥ Kiá»‡n Thá»i Trang", Slug = "quan-phu-kien-thoi-trang", Description = "TÃºi xÃ¡ch cao cáº¥p, kÃ­nh máº¯t, tháº¯t lÆ°ng da nguyÃªn táº¥m vÃ  nÆ°á»›c hoa" },
                new Category { Name = "Gia Dá»¥ng & Äá»i Sá»‘ng", Slug = "gia-dung-doi-song", Description = "Váº­t pháº©m ná»™i tháº¥t & phong cÃ¡ch sá»‘ng tinh táº¿ phong cÃ¡ch tá»‘i giáº£n" }
            };
            await context.Categories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
        }

        // ==========================================
        // 3. Náº P GIAN HÃ€NG (23 cá»­a hÃ ng)
        // ==========================================
        if (!await context.Stores.AnyAsync())
        {
            var stores = new List<Store>
            {
                new Store { StoreCode = "VN_HN_01", BrandId = "gucci", StoreName = "Gucci TrÃ ng Tiá»n Plaza", StoreType = "Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "Táº§ng 1, TrÃ ng Tiá»n Plaza, 24 Hai BÃ  TrÆ°ng, HoÃ n Kiáº¿m", Phone = "024 3936 9999", Email = "trangtien@gucci.com", OperatingHours = "09:30 - 21:30", Latitude = 21.0256, Longitude = 105.8524, ServicesJson = JsonSerializer.Serialize(new[] { "ChÄƒm sÃ³c khÃ¡ch VIP", "Äáº·t may Ä‘o riÃªng", "Báº£o hÃ nh trá»n Ä‘á»i" }), CategoriesJson = JsonSerializer.Serialize(new[] { "TÃºi xÃ¡ch", "GiÃ y dÃ©p", "Trang sá»©c" }), ImageUrl = "/img/gucci-runway.jpg", StoreUrl = "https://www.gucci.com" },
                new Store { StoreCode = "VN_SG_01", BrandId = "gucci", StoreName = "Gucci Sheraton Saigon", StoreType = "Luxury Boutique", City = "TP. Há»“ ChÃ­ Minh", Country = "Viá»‡t Nam", Address = "KhÃ¡ch sáº¡n Sheraton, 88 Äá»“ng Khá»Ÿi, Quáº­n 1", Phone = "028 3827 7777", Email = "sheraton@gucci.com", OperatingHours = "10:00 - 22:00", Latitude = 10.7745, Longitude = 106.7032, ServicesJson = JsonSerializer.Serialize(new[] { "PhÃ²ng thá»­ Ä‘á»“ VIP", "Giao hÃ ng há»a tá»‘c", "ÄÃ¡nh bÃ³ng da miá»…n phÃ­" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Thá»i trang ná»¯", "GiÃ y nam", "Phá»¥ kiá»‡n" }), ImageUrl = "/img/gucci-sneaker.jpg", StoreUrl = "https://www.gucci.com" },
                new Store { StoreCode = "VN_SG_02", BrandId = "gucci", StoreName = "Gucci Union Square", StoreType = "Concept Store", City = "TP. Há»“ ChÃ­ Minh", Country = "Viá»‡t Nam", Address = "Union Square, 171 Äá»“ng Khá»Ÿi, Báº¿n NghÃ©, Quáº­n 1", Phone = "028 3825 8888", Email = "unionsquare@gucci.com", OperatingHours = "09:30 - 22:00", Latitude = 10.7762, Longitude = 106.7021, ServicesJson = JsonSerializer.Serialize(new[] { "Kháº¯c tÃªn miá»…n phÃ­", "TÆ° váº¥n phá»‘i Ä‘á»“ cÃ¡ nhÃ¢n" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Bá»™ sÆ°u táº­p giá»›i háº¡n", "NÆ°á»›c hoa" }), ImageUrl = "/img/gucci-collection.jpg", StoreUrl = "https://www.gucci.com" },
                new Store { StoreCode = "VN_GUC_01", BrandId = "gucci", StoreName = "Gucci Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0005", Email = "contact@gucci.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Quáº§n & Phá»¥ Kiá»‡n Thá»i Trang", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/gucci/gucci-jackie-1961-mini.jpg", StoreUrl = "https://www.gucci.com" },
                new Store { StoreCode = "VN_DIO_01", BrandId = "dior", StoreName = "Christian Dior Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0004", Email = "contact@dior.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Quáº§n & Phá»¥ Kiá»‡n Thá»i Trang", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/dior/lady-dior-medium-cannage.jpg", StoreUrl = "https://www.dior.com" },
                new Store { StoreCode = "VN_ADI_01", BrandId = "adidas", StoreName = "Adidas Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0006", Email = "contact@adidas.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "GiÃ y Sneaker & Thá»ƒ Thao", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/adidas/adidas-samba-og-classic.jpg", StoreUrl = "https://www.adidas.com" },
                new Store { StoreCode = "VN_LOU_01", BrandId = "louisvuitton", StoreName = "Louis Vuitton Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0012", Email = "contact@louisvuitton.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Quáº§n & Phá»¥ Kiá»‡n Thá»i Trang", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/louisvuitton/lv-speedy-bandouliere-25.jpg", StoreUrl = "https://www.louisvuitton.com" },
                new Store { StoreCode = "VN_NIK_01", BrandId = "nike", StoreName = "Nike Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0004", Email = "contact@nike.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "GiÃ y Sneaker & Thá»ƒ Thao", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/nike/nike-air-force-1-white.jpg", StoreUrl = "https://www.nike.com" },
                new Store { StoreCode = "VN_CHA_01", BrandId = "chanel", StoreName = "Chanel Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0006", Email = "contact@chanel.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Quáº§n & Phá»¥ Kiá»‡n Thá»i Trang", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/chanel/chanel-classic-flap-bag.jpg", StoreUrl = "https://www.chanel.com" },
                new Store { StoreCode = "VN_PRA_01", BrandId = "prada", StoreName = "Prada Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0005", Email = "contact@prada.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Quáº§n & Phá»¥ Kiá»‡n Thá»i Trang", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/prada/prada-re-edition-2005-nylon.jpg", StoreUrl = "https://www.prada.com" },
                new Store { StoreCode = "VN_BAL_01", BrandId = "balenciaga", StoreName = "Balenciaga Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0010", Email = "contact@balenciaga.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Thá»i Trang Streetwear & Ão KhoÃ¡c", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/balenciaga/balenciaga-le-city-medium-bag.jpg", StoreUrl = "https://www.balenciaga.com" },
                new Store { StoreCode = "VN_HER_01", BrandId = "hermes", StoreName = "HermÃ¨s Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0006", Email = "contact@hermes.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Quáº§n & Phá»¥ Kiá»‡n Thá»i Trang", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/hermes/hermes-birkin-30-togo-gold.jpg", StoreUrl = "https://www.hermes.com" },
                new Store { StoreCode = "VN_VER_01", BrandId = "versace", StoreName = "Versace Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0007", Email = "contact@versace.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Thá»i Trang Streetwear & Ão KhoÃ¡c", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/versace/versace-la-medusa-handbag.jpg", StoreUrl = "https://www.versace.com" },
                new Store { StoreCode = "VN_BUR_01", BrandId = "burberry", StoreName = "Burberry Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0008", Email = "contact@burberry.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Thá»i Trang Streetwear & Ão KhoÃ¡c", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/burberry/burberry-kensington-trench-coat.jpg", StoreUrl = "https://www.burberry.com" },
                new Store { StoreCode = "VN_SAI_01", BrandId = "saintlaurent", StoreName = "Saint Laurent Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0012", Email = "contact@saintlaurent.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Thá»i Trang Streetwear & Ão KhoÃ¡c", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/saintlaurent/saintlaurent-loulou-medium-bag.jpg", StoreUrl = "https://www.saintlaurent.com" },
                new Store { StoreCode = "VN_FEN_01", BrandId = "fendi", StoreName = "Fendi Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0005", Email = "contact@fendi.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Quáº§n & Phá»¥ Kiá»‡n Thá»i Trang", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/fendi/fendi-baguette-medium-ff-bag.jpg", StoreUrl = "https://www.fendi.com" },
                new Store { StoreCode = "VN_BOT_01", BrandId = "bottegaveneta", StoreName = "Bottega Veneta Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0013", Email = "contact@bottegaveneta.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Quáº§n & Phá»¥ Kiá»‡n Thá»i Trang", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/bottegaveneta/bottegaveneta-the-pouch-clutch.jpg", StoreUrl = "https://www.bottegaveneta.com" },
                new Store { StoreCode = "VN_OFF_01", BrandId = "offwhite", StoreName = "Off-White Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0008", Email = "contact@offwhite.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Thá»i Trang Streetwear & Ão KhoÃ¡c", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/offwhite/offwhite-jitney-28-top-handle.jpg", StoreUrl = "https://www.offwhite.com" },
                new Store { StoreCode = "VN_PUM_01", BrandId = "puma", StoreName = "Puma Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0004", Email = "contact@puma.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "GiÃ y Sneaker & Thá»ƒ Thao", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/puma/puma-suede-classic-xxi.jpg", StoreUrl = "https://www.puma.com" },
                new Store { StoreCode = "VN_ZAR_01", BrandId = "zara", StoreName = "Zara Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0004", Email = "contact@zara.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Thá»i Trang Streetwear & Ão KhoÃ¡c", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/zara/zara-tailored-double-breasted-blazer.jpg", StoreUrl = "https://www.zara.com" },
                new Store { StoreCode = "VN_UNI_01", BrandId = "uniqlo", StoreName = "Uniqlo Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0006", Email = "contact@uniqlo.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Thá»i Trang Streetwear & Ão KhoÃ¡c", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/uniqlo/uniqlo-ultra-light-down-jacket.jpg", StoreUrl = "https://www.uniqlo.com" },
                new Store { StoreCode = "VN_CAL_01", BrandId = "calvinklein", StoreName = "Calvin Klein Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0011", Email = "contact@calvinklein.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Thá»i Trang Streetwear & Ão KhoÃ¡c", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/calvinklein/calvinklein-modern-cotton-bralette.jpg", StoreUrl = "https://www.calvinklein.com" },
                new Store { StoreCode = "VN_TOM_01", BrandId = "tommyhilfiger", StoreName = "Tommy Hilfiger Heritage Flagship Boutique", StoreType = "Global Flagship Boutique", City = "HÃ  Ná»™i", Country = "Viá»‡t Nam", Address = "TÃ²a nhÃ  Lotte Center, 54 Liá»…u Giai, Ba ÄÃ¬nh, HÃ  Ná»™i", Phone = "+84 24 3888 0013", Email = "contact@tommyhilfiger.vn", OperatingHours = "09:30 - 21:30", Latitude = 21.0315, Longitude = 105.8130, ServicesJson = JsonSerializer.Serialize(new[] { "Báº£o hÃ nh chÃ­nh hÃ£ng quá»‘c táº¿", "Kiá»ƒm Ä‘á»‹nh NFC Chip", "PhÃ²ng VIP Private Lounge" }), CategoriesJson = JsonSerializer.Serialize(new[] { "Thá»i Trang Streetwear & Ão KhoÃ¡c", "Haute Couture", "Ready-to-Wear" }), ImageUrl = "/img/brands/tommyhilfiger/tommyhilfiger-classic-oxford-shirt.jpg", StoreUrl = "https://www.tommyhilfiger.com" },
            };
            await context.Stores.AddRangeAsync(stores);
            await context.SaveChangesAsync();
        }

        // ==========================================
        // 4. Náº P Sáº¢N PHáº¨M & BIáº¾N THá»‚
        // ==========================================
        if (!await context.Products.AnyAsync())
        {
            var dbCategories = await context.Categories.ToListAsync();
            var catSneaker = dbCategories.FirstOrDefault(c => c.Slug == "giay-sneaker-the-thao") ?? dbCategories[0];
            var catStreetwear = dbCategories.FirstOrDefault(c => c.Slug == "thoi-trang-streetwear-ao-khoac") ?? dbCategories[1];
            var catAccessories = dbCategories.FirstOrDefault(c => c.Slug == "quan-phu-kien-thoi-trang") ?? dbCategories[2];
            var catLiving = dbCategories.FirstOrDefault(c => c.Slug == "gia-dung-doi-song") ?? dbCategories[3];

            var dbUsers = await context.Users.ToListAsync();

            // Tra cá»©u ngÆ°á»i bÃ¡n theo thÆ°Æ¡ng hiá»‡u cho cÃ¡c sáº£n pháº©m kinh Ä‘iá»ƒn ban Ä‘áº§u
            var earlyAdidas = dbUsers.First(u => u.Email == "adidas@gmail.com");
            var earlyBalenciaga = dbUsers.First(u => u.Email == "balenciaga@gmail.com");
            var earlyGucci = dbUsers.First(u => u.Email == "gucci@gmail.com");
            var earlyPuma = dbUsers.First(u => u.Email == "puma@gmail.com");
            var earlyNike = dbUsers.First(u => u.Email == "nike@gmail.com");
            var earlyDior = dbUsers.First(u => u.Email == "dior@gmail.com");
            var earlyLV = dbUsers.First(u => u.Email == "louisvuitton@gmail.com");
            var earlyChanel = dbUsers.First(u => u.Email == "chanel@gmail.com");
            var earlyPrada = dbUsers.First(u => u.Email == "prada@gmail.com");
            var earlyHermes = dbUsers.First(u => u.Email == "hermes@gmail.com");
            var earlySaintLaurent = dbUsers.First(u => u.Email == "saintlaurent@gmail.com");
            var earlyFendi = dbUsers.First(u => u.Email == "fendi@gmail.com");
            var earlyBottega = dbUsers.First(u => u.Email == "bottegaveneta@gmail.com");
            var earlyOffWhite = dbUsers.First(u => u.Email == "offwhite@gmail.com");

            var allProducts = new List<Product>();

            // --- A. 20 Sáº¢N PHáº¨M KINH ÄIá»‚N Cá»¦A CÃC THÆ¯Æ NG HIá»†U ---
            var p_giay_adidas_samba_og_classic = new Product
            {
                SellerId = earlyAdidas.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Adidas Samba OG Classic White Black",
                Slug = "giay-adidas-samba-og-classic",
                Sku = "ADI-SAMBA-01",
                CollectionName = "Adidas Originals Terrace",
                Description = "GiÃ y thá»ƒ thao Adidas Samba OG phiÃªn báº£n Classic phá»‘i mÃ u tráº¯ng Ä‘en cá»• Ä‘iá»ƒn, cháº¥t liá»‡u da tháº­t cao cáº¥p káº¿t há»£p mÅ©i T-toe da lá»™n.",
                BasePrice = 2790000m,
                OriginalPrice = 3200000m,
                DiscountPercent = 12,
                ImageUrl = "/img/adidas-samba.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/adidas-samba.jpg", "/img/adidas-samba.jpg", "/img/adidas-samba.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da tháº­t full-grain",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_giay_adidas_samba_og_classic.Variants.Add(new ProductVariant { Sku = "ADI-SAMBA-01-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2790000m, StockQuantity = 15 });
            p_giay_adidas_samba_og_classic.Variants.Add(new ProductVariant { Sku = "ADI-SAMBA-01-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2790000m, StockQuantity = 20 });
            p_giay_adidas_samba_og_classic.Variants.Add(new ProductVariant { Sku = "ADI-SAMBA-01-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2790000m, StockQuantity = 10 });
            allProducts.Add(p_giay_adidas_samba_og_classic);

            var p_ao_khoac_ni_adidas_sakura_special_edition = new Product
            {
                SellerId = earlyAdidas.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c Ná»‰ Adidas Sakura Special Edition",
                Slug = "ao-khoac-ni-adidas-sakura-special-edition",
                Sku = "ADI-SAKURA-02",
                CollectionName = "Adidas Spring Collection",
                Description = "Ão khoÃ¡c hoodie ná»‰ bÃ´ng phiÃªn báº£n giá»›i háº¡n Sakura hoa anh Ä‘Ã o, cháº¥t ná»‰ 380gsm dÃ y dáº·n dá»‡t bo gáº¥u tinh táº¿.",
                BasePrice = 1890000m,
                OriginalPrice = 2200000m,
                DiscountPercent = 14,
                ImageUrl = "/img/adidas-sakura-hoodie.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/adidas-sakura-hoodie.jpg", "/img/adidas-sakura-hoodie.jpg", "/img/adidas-sakura-hoodie.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Ná»‰ bÃ´ng cotton 100%",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Viá»‡t Nam",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_ao_khoac_ni_adidas_sakura_special_edition.Variants.Add(new ProductVariant { Sku = "ADI-SAKURA-02-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1890000m, StockQuantity = 18 });
            p_ao_khoac_ni_adidas_sakura_special_edition.Variants.Add(new ProductVariant { Sku = "ADI-SAKURA-02-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1890000m, StockQuantity = 15 });
            p_ao_khoac_ni_adidas_sakura_special_edition.Variants.Add(new ProductVariant { Sku = "ADI-SAKURA-02-XL", Size = "Size XL", Color = "TiÃªu chuáº©n", Price = 1890000m, StockQuantity = 12 });
            allProducts.Add(p_ao_khoac_ni_adidas_sakura_special_edition);

            var p_giay_balenciaga_track_40_tan_beige = new Product
            {
                SellerId = earlyBalenciaga.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Balenciaga Track 4.0 Tan/Beige Limited",
                Slug = "giay-balenciaga-track-40-tan-beige",
                Sku = "BAL-TRACK-03",
                CollectionName = "Balenciaga Track Series",
                Description = "GiÃ y thá»ƒ thao Balenciaga Track 4.0 phá»‘i mÃ u Tan/Beige thá»i thÆ°á»£ng, káº¿t cáº¥u layer 128 chi tiáº¿t phá»©c táº¡p chuáº©n sÃ n diá»…n.",
                BasePrice = 24500000m,
                OriginalPrice = 27000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/balenciaga-track-beige.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/balenciaga-track-beige.jpg", "/img/balenciaga-track-beige.jpg", "/img/balenciaga-track-beige.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da nhÃ¢n táº¡o, lÆ°á»›i mesh ká»¹ thuáº­t",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_giay_balenciaga_track_40_tan_beige.Variants.Add(new ProductVariant { Sku = "BAL-TRACK-03-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 24500000m, StockQuantity = 15 });
            p_giay_balenciaga_track_40_tan_beige.Variants.Add(new ProductVariant { Sku = "BAL-TRACK-03-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 24500000m, StockQuantity = 20 });
            p_giay_balenciaga_track_40_tan_beige.Variants.Add(new ProductVariant { Sku = "BAL-TRACK-03-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 24500000m, StockQuantity = 10 });
            allProducts.Add(p_giay_balenciaga_track_40_tan_beige);

            var p_giay_balenciaga_track_thug_edition_black = new Product
            {
                SellerId = earlyBalenciaga.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Balenciaga Track Thug Edition Black",
                Slug = "giay-balenciaga-track-thug-edition-black",
                Sku = "BAL-TRACK-04",
                CollectionName = "Balenciaga Street Noir",
                Description = "Thiáº¿t káº¿ háº§m há»‘ phong cÃ¡ch goth streetwear, Ä‘áº¿ dÃ y 3 táº§ng giáº£m xÃ³c vÆ°á»£t trá»™i cÃ¹ng logo BB in ná»•i á»Ÿ mÅ©i giÃ y.",
                BasePrice = 25900000m,
                OriginalPrice = 28500000m,
                DiscountPercent = 9,
                ImageUrl = "/img/balenciaga-track-black.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/balenciaga-track-black.jpg", "/img/balenciaga-track-black.jpg", "/img/balenciaga-track-black.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Mesh dá»‡t, TPU cao cáº¥p",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_giay_balenciaga_track_thug_edition_black.Variants.Add(new ProductVariant { Sku = "BAL-TRACK-04-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 25900000m, StockQuantity = 15 });
            p_giay_balenciaga_track_thug_edition_black.Variants.Add(new ProductVariant { Sku = "BAL-TRACK-04-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 25900000m, StockQuantity = 20 });
            p_giay_balenciaga_track_thug_edition_black.Variants.Add(new ProductVariant { Sku = "BAL-TRACK-04-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 25900000m, StockQuantity = 10 });
            allProducts.Add(p_giay_balenciaga_track_thug_edition_black);

            var p_quan_ni_balenciaga_paris_sweatpants_white = new Product
            {
                SellerId = earlyBalenciaga.Id,
                CategoryId = catStreetwear.Id,
                Name = "Quáº§n Ná»‰ Balenciaga Paris Sweatpants White",
                Slug = "quan-ni-balenciaga-paris-sweatpants-white",
                Sku = "BAL-SWEAT-05",
                CollectionName = "Balenciaga Winter Capsule",
                Description = "Quáº§n ná»‰ á»‘ng suÃ´ng phom rá»™ng oversize Paris Edition, logo thÃªu chá»‰ kim tuyáº¿n tinh xáº£o á»Ÿ Ä‘Ã¹i trÃ¡i.",
                BasePrice = 16500000m,
                OriginalPrice = 18500000m,
                DiscountPercent = 10,
                ImageUrl = "/img/balenciaga-track-street.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/balenciaga-track-street.jpg", "/img/balenciaga-track-street.jpg", "/img/balenciaga-track-street.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Cotton da cÃ¡ dá»‡t dÃ y dáº·n",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Bá»“ ÄÃ o Nha",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_quan_ni_balenciaga_paris_sweatpants_white.Variants.Add(new ProductVariant { Sku = "BAL-SWEAT-05-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 16500000m, StockQuantity = 18 });
            p_quan_ni_balenciaga_paris_sweatpants_white.Variants.Add(new ProductVariant { Sku = "BAL-SWEAT-05-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 16500000m, StockQuantity = 15 });
            p_quan_ni_balenciaga_paris_sweatpants_white.Variants.Add(new ProductVariant { Sku = "BAL-SWEAT-05-XL", Size = "Size XL", Color = "TiÃªu chuáº©n", Price = 16500000m, StockQuantity = 12 });
            allProducts.Add(p_quan_ni_balenciaga_paris_sweatpants_white);

            var p_ao_khoac_oversized_ripped_balenciaga = new Product
            {
                SellerId = earlyBalenciaga.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c Oversized Ripped Balenciaga Denim",
                Slug = "ao-khoac-oversized-ripped-balenciaga",
                Sku = "BAL-DENIM-06",
                CollectionName = "Balenciaga Distressed",
                Description = "Ão khoÃ¡c bÃ² wash báº¡c xÃ© rÃ¡ch thá»§ cÃ´ng tá»«ng chi tiáº¿t, form drop-shoulder Ä‘áº­m cháº¥t Ä‘Æ°á»ng phá»‘ avant-garde.",
                BasePrice = 34000000m,
                OriginalPrice = 38000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/balenciaga-ripped-jacket.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/balenciaga-ripped-jacket.jpg", "/img/balenciaga-ripped-jacket.jpg", "/img/balenciaga-ripped-jacket.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Denim cotton Nháº­t Báº£n 14oz",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Nháº­t Báº£n",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_ao_khoac_oversized_ripped_balenciaga.Variants.Add(new ProductVariant { Sku = "BAL-DENIM-06-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 34000000m, StockQuantity = 18 });
            p_ao_khoac_oversized_ripped_balenciaga.Variants.Add(new ProductVariant { Sku = "BAL-DENIM-06-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 34000000m, StockQuantity = 15 });
            p_ao_khoac_oversized_ripped_balenciaga.Variants.Add(new ProductVariant { Sku = "BAL-DENIM-06-XL", Size = "Size XL", Color = "TiÃªu chuáº©n", Price = 34000000m, StockQuantity = 12 });
            allProducts.Add(p_ao_khoac_oversized_ripped_balenciaga);

            var p_giay_sneaker_gucci_ace_web_leather = new Product
            {
                SellerId = earlyGucci.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Gucci Ace Web Leather Original",
                Slug = "giay-sneaker-gucci-ace-web-leather",
                Sku = "GUC-ACE-07",
                CollectionName = "Gucci Epilogue",
                Description = "GiÃ y sneaker cá»• tháº¥p da bÃ² Nappa tráº¯ng tinh khÃ´i, dáº£i ruy bÄƒng Web xanh Ä‘á» kinh Ä‘iá»ƒn bÃªn thÃ¢n giÃ y.",
                BasePrice = 18900000m,
                OriginalPrice = 21000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/gucci-sneaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/gucci-sneaker.jpg", "/img/gucci-sneaker.jpg", "/img/gucci-sneaker.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² Nappa cao cáº¥p Ã",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_giay_sneaker_gucci_ace_web_leather.Variants.Add(new ProductVariant { Sku = "GUC-ACE-07-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 18900000m, StockQuantity = 15 });
            p_giay_sneaker_gucci_ace_web_leather.Variants.Add(new ProductVariant { Sku = "GUC-ACE-07-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 18900000m, StockQuantity = 20 });
            p_giay_sneaker_gucci_ace_web_leather.Variants.Add(new ProductVariant { Sku = "GUC-ACE-07-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 18900000m, StockQuantity = 10 });
            allProducts.Add(p_giay_sneaker_gucci_ace_web_leather);

            var p_kinh_mat_gucci_double_g_rectangular = new Product
            {
                SellerId = earlyGucci.Id,
                CategoryId = catAccessories.Id,
                Name = "KÃ­nh MÃ¡t Gucci Double G Rectangular Cream Gold",
                Slug = "kinh-mat-gucci-double-g-rectangular",
                Sku = "GUC-GLASS-08",
                CollectionName = "Gucci Eyewear Couture",
                Description = "KÃ­nh mÃ¡t gá»ng chá»¯ nháº­t mÃ u kem phá»‘i logo GG máº¡ vÃ ng sÃ¡ng bÃ³ng, trÃ²ng chá»‘ng chÃ³i quang há»c UV400 chuáº©n chÃ¢u Ã‚u.",
                BasePrice = 11500000m,
                OriginalPrice = 13000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/gucci-runway.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/gucci-runway.jpg", "/img/gucci-runway.jpg", "/img/gucci-runway.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Acetate Ä‘Ãºc nguyÃªn khá»‘i, máº¯t kÃ­nh CR-39",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_kinh_mat_gucci_double_g_rectangular.Variants.Add(new ProductVariant { Sku = "GUC-GLASS-08-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 11500000m, StockQuantity = 45 });
            allProducts.Add(p_kinh_mat_gucci_double_g_rectangular);

            var p_giay_the_thao_puma_suede_classic_retro = new Product
            {
                SellerId = earlyPuma.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Thá»ƒ Thao Puma Suede Classic Retro",
                Slug = "giay-the-thao-puma-suede-classic-retro",
                Sku = "PUM-SUEDE-09",
                CollectionName = "Puma Heritage Line",
                Description = "Huyá»n thoáº¡i giÃ y da lá»™n Puma Suede ra Ä‘á»i tá»« nÄƒm 1968, phá»‘i mÃ u cá»• Ä‘iá»ƒn Ãªm Ã¡i cho má»i trang phá»¥c dáº¡o phá»‘.",
                BasePrice = 2190000m,
                OriginalPrice = 2500000m,
                DiscountPercent = 12,
                ImageUrl = "/img/puma-shoes-fall.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/puma-shoes-fall.jpg", "/img/puma-shoes-fall.jpg", "/img/puma-shoes-fall.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da lá»™n cao cáº¥p nguyÃªn táº¥m",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Indonesia",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_giay_the_thao_puma_suede_classic_retro.Variants.Add(new ProductVariant { Sku = "PUM-SUEDE-09-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2190000m, StockQuantity = 15 });
            p_giay_the_thao_puma_suede_classic_retro.Variants.Add(new ProductVariant { Sku = "PUM-SUEDE-09-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2190000m, StockQuantity = 20 });
            p_giay_the_thao_puma_suede_classic_retro.Variants.Add(new ProductVariant { Sku = "PUM-SUEDE-09-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2190000m, StockQuantity = 10 });
            allProducts.Add(p_giay_the_thao_puma_suede_classic_retro);

            var p_giay_nike_air_force_1_low_07_white = new Product
            {
                SellerId = earlyNike.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Nike Air Force 1 Low '07 Triple White",
                Slug = "giay-nike-air-force-1-low-07-white",
                Sku = "NIK-AF1-10",
                CollectionName = "Nike Sportswear Icons",
                Description = "Huyá»n thoáº¡i bÃ³ng rá»• Ä‘Æ°á»ng phá»‘ 1982 vá»›i Ä‘á»‡m Air-Sole Ãªm Ã¡i, Ä‘áº¿ ngoÃ i cao su rÃ£nh trÃ²n pivot-circle bÃ¡m dÃ­nh tá»‘t.",
                BasePrice = 2990000m,
                OriginalPrice = 3400000m,
                DiscountPercent = 12,
                ImageUrl = "/img/nike-summer-sneaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/nike-summer-sneaker.jpg", "/img/nike-summer-sneaker.jpg", "/img/nike-summer-sneaker.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² trÆ¡n phá»§ bÃ³ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Viá»‡t Nam",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_giay_nike_air_force_1_low_07_white.Variants.Add(new ProductVariant { Sku = "NIK-AF1-10-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2990000m, StockQuantity = 15 });
            p_giay_nike_air_force_1_low_07_white.Variants.Add(new ProductVariant { Sku = "NIK-AF1-10-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2990000m, StockQuantity = 20 });
            p_giay_nike_air_force_1_low_07_white.Variants.Add(new ProductVariant { Sku = "NIK-AF1-10-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2990000m, StockQuantity = 10 });
            allProducts.Add(p_giay_nike_air_force_1_low_07_white);

            var p_tui_xach_lady_dior_medium_cannage = new Product
            {
                SellerId = earlyDior.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Lady Dior Medium Cannage Lambskin",
                Slug = "tui-xach-lady-dior-medium-cannage",
                Sku = "DIO-LADY-11",
                CollectionName = "Dior Heritage Icons",
                Description = "Chiáº¿c tÃºi gáº¯n liá»n vá»›i CÃ´ng nÆ°Æ¡ng Diana, da cá»«u non cháº§n bÃ´ng motif Cannage cÃ¹ng bá»™ phá»¥ kiá»‡n charm D.I.O.R máº¡ vÃ ng.",
                BasePrice = 155000000m,
                OriginalPrice = 170000000m,
                DiscountPercent = 8,
                ImageUrl = "/img/brands/dior/lady-dior-medium-cannage.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/dior/lady-dior-medium-cannage.jpg", "/img/brands/dior/lady-dior-medium-cannage.jpg", "/img/brands/dior/lady-dior-medium-cannage.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da cá»«u non cao cáº¥p Cannage",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_tui_xach_lady_dior_medium_cannage.Variants.Add(new ProductVariant { Sku = "DIO-LADY-11-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 155000000m, StockQuantity = 45 });
            allProducts.Add(p_tui_xach_lady_dior_medium_cannage);

            var p_tui_xach_jackie_1961_mini_hobo = new Product
            {
                SellerId = earlyGucci.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Jackie 1961 Mini Hobo Leather",
                Slug = "tui-xach-jackie-1961-mini-hobo",
                Sku = "GUC-JACKIE-12",
                CollectionName = "Gucci 1961 Archival",
                Description = "Biá»ƒu tÆ°á»£ng thá»i trang thanh lá»‹ch vá»›i khÃ³a chá»‘t piston vÃ ng bÃ³ng vÃ  quai Ä‘eo da thÃ¡o rá»i tiá»‡n lá»£i.",
                BasePrice = 62000000m,
                OriginalPrice = 70000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/gucci/gucci-jackie-1961-mini.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/gucci/gucci-jackie-1961-mini.jpg", "/img/brands/gucci/gucci-jackie-1961-mini.jpg", "/img/brands/gucci/gucci-jackie-1961-mini.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª bÃ³ng thuá»™c tháº£o má»™c",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_tui_xach_jackie_1961_mini_hobo.Variants.Add(new ProductVariant { Sku = "GUC-JACKIE-12-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 62000000m, StockQuantity = 45 });
            allProducts.Add(p_tui_xach_jackie_1961_mini_hobo);

            var p_tui_xach_louis_vuitton_speedy_25 = new Product
            {
                SellerId = earlyLV.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Louis Vuitton Speedy BandouliÃ¨re 25",
                Slug = "tui-xach-louis-vuitton-speedy-25",
                Sku = "LV-SPEEDY-13",
                CollectionName = "Louis Vuitton Monogram Heritage",
                Description = "TÃºi dÃ¡ng trá»‘ng kinh Ä‘iá»ƒn cháº¿ tÃ¡c tá»« Canvas Monogram trá»© danh, tay cáº§m bá»c da Toron thá»§ cÃ´ng khÃ¢u tay tá»‰ má»‰.",
                BasePrice = 48500000m,
                OriginalPrice = 55000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/louisvuitton/lv-speedy-bandouliere-25.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/louisvuitton/lv-speedy-bandouliere-25.jpg", "/img/brands/louisvuitton/lv-speedy-bandouliere-25.jpg", "/img/brands/louisvuitton/lv-speedy-bandouliere-25.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Canvas Monogram chá»‘ng tháº¥m",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_tui_xach_louis_vuitton_speedy_25.Variants.Add(new ProductVariant { Sku = "LV-SPEEDY-13-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 48500000m, StockQuantity = 45 });
            allProducts.Add(p_tui_xach_louis_vuitton_speedy_25);

            var p_tui_xach_chanel_classic_double_flap = new Product
            {
                SellerId = earlyChanel.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Chanel Classic Double Flap Lambskin",
                Slug = "tui-xach-chanel-classic-double-flap",
                Sku = "CHA-FLAP-14",
                CollectionName = "Chanel Timeless",
                Description = "Chiáº¿c tÃºi Ä‘áº¯t giÃ¡ nháº¥t má»i thá»i Ä‘áº¡i cháº¿ tÃ¡c thá»§ cÃ´ng bá»Ÿi cÃ¡c nghá»‡ nhÃ¢n Paris, khÃ³a xoay Mademoiselle máº¡ vÃ ng.",
                BasePrice = 260000000m,
                OriginalPrice = 280000000m,
                DiscountPercent = 7,
                ImageUrl = "/img/brands/chanel/chanel-classic-flap-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/chanel/chanel-classic-flap-bag.jpg", "/img/brands/chanel/chanel-classic-flap-bag.jpg", "/img/brands/chanel/chanel-classic-flap-bag.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da cá»«u má»m máº¡i cháº§n bÃ´ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_tui_xach_chanel_classic_double_flap.Variants.Add(new ProductVariant { Sku = "CHA-FLAP-14-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 260000000m, StockQuantity = 45 });
            allProducts.Add(p_tui_xach_chanel_classic_double_flap);

            var p_tui_xach_prada_re_edition_2005_nylon = new Product
            {
                SellerId = earlyPrada.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Prada Re-Edition 2005 Re-Nylon",
                Slug = "tui-xach-prada-re-edition-2005-nylon",
                Sku = "PRA-RE05-15",
                CollectionName = "Prada Re-Nylon Archive",
                Description = "Chiáº¿c tÃºi káº¹p nÃ¡ch Ä‘Æ°á»£c sÄƒn Ä‘Ã³n toÃ n cáº§u, váº£i Re-Nylon tÃ¡i sinh káº¿t há»£p viá»n da Saffiano vÃ  mÃ³c vÃ­ nhá».",
                BasePrice = 45000000m,
                OriginalPrice = 50000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/prada/prada-re-edition-2005-nylon.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/prada/prada-re-edition-2005-nylon.jpg", "/img/brands/prada/prada-re-edition-2005-nylon.jpg", "/img/brands/prada/prada-re-edition-2005-nylon.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Re-Nylon khÃ¡ng nÆ°á»›c, da Saffiano",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_tui_xach_prada_re_edition_2005_nylon.Variants.Add(new ProductVariant { Sku = "PRA-RE05-15-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 45000000m, StockQuantity = 45 });
            allProducts.Add(p_tui_xach_prada_re_edition_2005_nylon);

            var p_tui_xach_hermes_birkin_30_togo = new Product
            {
                SellerId = earlyHermes.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch HermÃ¨s Birkin 30 Togo Gold Hardware",
                Slug = "tui-xach-hermes-birkin-30-togo",
                Sku = "HER-BIRKIN-16",
                CollectionName = "HermÃ¨s Exceptional Pieces",
                Description = "Äá»‰nh cao tÃºi xÃ¡ch xa xá»‰ tháº¿ giá»›i, tá»«ng mÅ©i khÃ¢u yÃªn ngá»±a Saddle Stitch may tay hoÃ n toÃ n vá»›i 48 giá» cháº¿ tÃ¡c.",
                BasePrice = 380000000m,
                OriginalPrice = 420000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/hermes/hermes-birkin-30-togo-gold.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/hermes/hermes-birkin-30-togo-gold.jpg", "/img/brands/hermes/hermes-birkin-30-togo-gold.jpg", "/img/brands/hermes/hermes-birkin-30-togo-gold.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª Togo sáº§n nguyÃªn táº¥m",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_tui_xach_hermes_birkin_30_togo.Variants.Add(new ProductVariant { Sku = "HER-BIRKIN-16-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 380000000m, StockQuantity = 45 });
            allProducts.Add(p_tui_xach_hermes_birkin_30_togo);

            var p_tui_xach_saint_laurent_loulou_medium = new Product
            {
                SellerId = earlySaintLaurent.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Saint Laurent LouLou Medium Quilted",
                Slug = "tui-xach-saint-laurent-loulou-medium",
                Sku = "YSL-LOULOU-17",
                CollectionName = "Saint Laurent Monogram",
                Description = "Cháº¥t da bÃª má»m má»‹n may cháº§n bÃ´ng chá»¯ Y Ä‘áº·c trÆ°ng, khÃ³a kim loáº¡i lá»“ng chá»¯ YSL phá»§ lá»›p máº¡ báº¡c Ã¡nh kim.",
                BasePrice = 78000000m,
                OriginalPrice = 86000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/saintlaurent/saintlaurent-loulou-medium-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/saintlaurent/saintlaurent-loulou-medium-bag.jpg", "/img/brands/saintlaurent/saintlaurent-loulou-medium-bag.jpg", "/img/brands/saintlaurent/saintlaurent-loulou-medium-bag.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª bÃ³ng may cháº§n cao cáº¥p",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_tui_xach_saint_laurent_loulou_medium.Variants.Add(new ProductVariant { Sku = "YSL-LOULOU-17-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 78000000m, StockQuantity = 45 });
            allProducts.Add(p_tui_xach_saint_laurent_loulou_medium);

            var p_tui_xach_fendi_baguette_medium_nappa = new Product
            {
                SellerId = earlyFendi.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Fendi Baguette Medium Nappa Monogram",
                Slug = "tui-xach-fendi-baguette-medium-nappa",
                Sku = "FEN-BAGUETTE-18",
                CollectionName = "Fendi Baguette 1997",
                Description = "Chiáº¿c tÃºi lÃ m thay Ä‘á»•i lá»‹ch sá»­ phá»¥ kiá»‡n vá»›i dÃ¡ng káº¹p nÃ¡ch gá»n gÃ ng vÃ  khÃ³a cÃ i nam chÃ¢m chá»¯ FF máº¡ bÃ³ng.",
                BasePrice = 85000000m,
                OriginalPrice = 93000000m,
                DiscountPercent = 8,
                ImageUrl = "/img/brands/fendi/fendi-baguette-medium-ff-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/fendi/fendi-baguette-medium-ff-bag.jpg", "/img/brands/fendi/fendi-baguette-medium-ff-bag.jpg", "/img/brands/fendi/fendi-baguette-medium-ff-bag.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da cá»«u nappa má»m dáº­p ná»•i FF",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_tui_xach_fendi_baguette_medium_nappa.Variants.Add(new ProductVariant { Sku = "FEN-BAGUETTE-18-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 85000000m, StockQuantity = 45 });
            allProducts.Add(p_tui_xach_fendi_baguette_medium_nappa);

            var p_tui_xach_bottega_veneta_the_pouch = new Product
            {
                SellerId = earlyBottega.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Bottega Veneta The Pouch Soft Calf",
                Slug = "tui-xach-bottega-veneta-the-pouch",
                Sku = "BOT-POUCH-19",
                CollectionName = "Bottega Veneta Wardrobe",
                Description = "Thiáº¿t káº¿ clutch cáº§m tay xáº¿p náº¿p bá»“ng bá»nh má»m máº¡i nhÆ° mÃ¢y khÃ´ng quai xÃ¡ch lÃ m bÃ¹ng ná»• giá»›i má»™ Ä‘iá»‡u.",
                BasePrice = 78000000m,
                OriginalPrice = 86000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/bottegaveneta/bottegaveneta-the-pouch-clutch.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/bottegaveneta/bottegaveneta-the-pouch-clutch.jpg", "/img/brands/bottegaveneta/bottegaveneta-the-pouch-clutch.jpg", "/img/brands/bottegaveneta/bottegaveneta-the-pouch-clutch.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª non náº¿p gáº¥p thá»§ cÃ´ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_tui_xach_bottega_veneta_the_pouch.Variants.Add(new ProductVariant { Sku = "BOT-POUCH-19-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 78000000m, StockQuantity = 45 });
            allProducts.Add(p_tui_xach_bottega_veneta_the_pouch);

            var p_tui_xach_off_white_jitney_28_quote = new Product
            {
                SellerId = earlyOffWhite.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Off-White Jitney 2.8 Quote Top Handle",
                Slug = "tui-xach-off-white-jitney-28-quote",
                Sku = "OFF-JITNEY-20",
                CollectionName = "Off-White Industrial Chic",
                Description = "Phong cÃ¡ch streetwear ná»•i loáº¡n cá»§a cá»‘ giÃ¡m Ä‘á»‘c sÃ¡ng táº¡o Virgil Abloh, chá»¯ in Typography vÃ  khÃ³a mÅ©i tÃªn kim loáº¡i.",
                BasePrice = 38000000m,
                OriginalPrice = 43000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/offwhite/offwhite-jitney-28-top-handle.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/offwhite/offwhite-jitney-28-top-handle.jpg", "/img/brands/offwhite/offwhite-jitney-28-top-handle.jpg", "/img/brands/offwhite/offwhite-jitney-28-top-handle.jpg" }),
                StockQuantity = 45,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª trÆ¡n in chá»¯ cÃ¡ tÃ­nh",
                CareInstructions = "Vá»‡ sinh chuyÃªn dá»¥ng báº±ng khÄƒn má»m, trÃ¡nh nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m",
                PackagingDetails = "Há»™p nguyÃªn seal cá»§a hÃ£ng, tÃºi váº£i chá»‘ng bá»¥i, tháº» báº£o hÃ nh NFC chÃ­nh hÃ£ng",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 128,
                IsActive = true
            };
            p_tui_xach_off_white_jitney_28_quote.Variants.Add(new ProductVariant { Sku = "OFF-JITNEY-20-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 38000000m, StockQuantity = 45 });
            allProducts.Add(p_tui_xach_off_white_jitney_28_quote);

            // --- B. 160 Sáº¢N PHáº¨M CHUáº¨N Cá»¦A 20 THÆ¯Æ NG HIá»†U QUá»C Táº¾ ---
            var seller_gucci = dbUsers.First(u => u.Email == "gucci@gmail.com");
            var prod_gucci_gucci_jackie_1961_mini = new Product
            {
                SellerId = seller_gucci.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Jackie 1961 Mini Shoulder Bag",
                Slug = "gucci-gucci-jackie-1961-mini",
                Sku = "GUC-MINI-3",
                CollectionName = "Gucci Icons",
                Description = "TÃºi XÃ¡ch Jackie 1961 Mini Shoulder Bag chÃ­nh hÃ£ng tá»« Gucci. Cháº¿ tÃ¡c tá»« Da bÃª bÃ³ng / KhÃ³a Piston máº¡ vÃ ng 18K vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 62000000m,
                OriginalPrice = 70000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/gucci/gucci-jackie-1961-mini.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/gucci/gucci-jackie-1961-mini.jpg", "/img/brands/gucci/gucci-jackie-1961-mini.jpg", "/img/brands/gucci/gucci-jackie-1961-mini.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª bÃ³ng / KhÃ³a Piston máº¡ vÃ ng 18K",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Gucci, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_gucci_gucci_jackie_1961_mini.Variants.Add(new ProductVariant { Sku = "GUC-MINI-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 62000000m, StockQuantity = 50 });
            allProducts.Add(prod_gucci_gucci_jackie_1961_mini);
            var prod_gucci_gucci_dionysus_gg_supreme = new Product
            {
                SellerId = seller_gucci.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Dionysus GG Supreme Mini Chain",
                Slug = "gucci-gucci-dionysus-gg-supreme",
                Sku = "GUC-SUPR-3",
                CollectionName = "Gucci Dionysus",
                Description = "TÃºi XÃ¡ch Dionysus GG Supreme Mini Chain chÃ­nh hÃ£ng tá»« Gucci. Cháº¿ tÃ¡c tá»« Canvas GG Supreme & KhÃ³a Ä‘áº§u há»• cháº¡m báº¡c vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 32000000m,
                OriginalPrice = 36000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/gucci/gucci-dionysus-gg-supreme.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/gucci/gucci-dionysus-gg-supreme.jpg", "/img/brands/gucci/gucci-dionysus-gg-supreme.jpg", "/img/brands/gucci/gucci-dionysus-gg-supreme.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Canvas GG Supreme & KhÃ³a Ä‘áº§u há»• cháº¡m báº¡c",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Gucci, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_gucci_gucci_dionysus_gg_supreme.Variants.Add(new ProductVariant { Sku = "GUC-SUPR-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 32000000m, StockQuantity = 50 });
            allProducts.Add(prod_gucci_gucci_dionysus_gg_supreme);
            var prod_gucci_gucci_ace_sneaker_web = new Product
            {
                SellerId = seller_gucci.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Gucci Ace Web Embroidered",
                Slug = "gucci-gucci-ace-sneaker-web",
                Sku = "GUC-WEB-1",
                CollectionName = "Gucci Footwear",
                Description = "GiÃ y Sneaker Gucci Ace Web Embroidered chÃ­nh hÃ£ng tá»« Gucci. Cháº¿ tÃ¡c tá»« Da bÃ² Nappa Ã tráº¯ng, sá»c Web xanh Ä‘á» vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 18900000m,
                OriginalPrice = 21000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/gucci/gucci-ace-sneaker-web.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/gucci/gucci-ace-sneaker-web.jpg", "/img/brands/gucci/gucci-ace-sneaker-web.jpg", "/img/brands/gucci/gucci-ace-sneaker-web.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² Nappa Ã tráº¯ng, sá»c Web xanh Ä‘á»",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Gucci, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_gucci_gucci_ace_sneaker_web.Variants.Add(new ProductVariant { Sku = "GUC-WEB-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 18900000m, StockQuantity = 15 });
            prod_gucci_gucci_ace_sneaker_web.Variants.Add(new ProductVariant { Sku = "GUC-WEB-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 18900000m, StockQuantity = 20 });
            prod_gucci_gucci_ace_sneaker_web.Variants.Add(new ProductVariant { Sku = "GUC-WEB-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 18900000m, StockQuantity = 15 });
            allProducts.Add(prod_gucci_gucci_ace_sneaker_web);
            var prod_gucci_gucci_jordaan_loafer = new Product
            {
                SellerId = seller_gucci.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Loafer Jordaan Classic Horsebit",
                Slug = "gucci-gucci-jordaan-loafer",
                Sku = "GUC-LOAF-1",
                CollectionName = "Gucci Jordaan",
                Description = "GiÃ y Loafer Jordaan Classic Horsebit chÃ­nh hÃ£ng tá»« Gucci. Cháº¿ tÃ¡c tá»« Da bÃ³ng má»‹n, hÃ m thiáº¿c máº¡ vÃ ng thá»§ cÃ´ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 26500000m,
                OriginalPrice = 29000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/gucci/gucci-jordaan-loafer.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/gucci/gucci-jordaan-loafer.jpg", "/img/brands/gucci/gucci-jordaan-loafer.jpg", "/img/brands/gucci/gucci-jordaan-loafer.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ³ng má»‹n, hÃ m thiáº¿c máº¡ vÃ ng thá»§ cÃ´ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Gucci, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_gucci_gucci_jordaan_loafer.Variants.Add(new ProductVariant { Sku = "GUC-LOAF-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 26500000m, StockQuantity = 15 });
            prod_gucci_gucci_jordaan_loafer.Variants.Add(new ProductVariant { Sku = "GUC-LOAF-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 26500000m, StockQuantity = 20 });
            prod_gucci_gucci_jordaan_loafer.Variants.Add(new ProductVariant { Sku = "GUC-LOAF-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 26500000m, StockQuantity = 15 });
            allProducts.Add(prod_gucci_gucci_jordaan_loafer);
            var prod_gucci_gucci_runway_monogram_jacket = new Product
            {
                SellerId = seller_gucci.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c Heritage Monogram GG Runway Jacket",
                Slug = "gucci-gucci-runway-monogram-jacket",
                Sku = "GUC-JACK-2",
                CollectionName = "Gucci Runway",
                Description = "Ão KhoÃ¡c Heritage Monogram GG Runway Jacket chÃ­nh hÃ£ng tá»« Gucci. Cháº¿ tÃ¡c tá»« Váº£i dá»‡t Jacquard GG cao cáº¥p vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 48000000m,
                OriginalPrice = 54000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/gucci/gucci-runway-monogram-jacket.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/gucci/gucci-runway-monogram-jacket.jpg", "/img/brands/gucci/gucci-runway-monogram-jacket.jpg", "/img/brands/gucci/gucci-runway-monogram-jacket.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i dá»‡t Jacquard GG cao cáº¥p",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Gucci, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_gucci_gucci_runway_monogram_jacket.Variants.Add(new ProductVariant { Sku = "GUC-JACK-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 48000000m, StockQuantity = 15 });
            prod_gucci_gucci_runway_monogram_jacket.Variants.Add(new ProductVariant { Sku = "GUC-JACK-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 48000000m, StockQuantity = 20 });
            prod_gucci_gucci_runway_monogram_jacket.Variants.Add(new ProductVariant { Sku = "GUC-JACK-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 48000000m, StockQuantity = 15 });
            allProducts.Add(prod_gucci_gucci_runway_monogram_jacket);
            var prod_gucci_gucci_double_g_belt = new Product
            {
                SellerId = seller_gucci.Id,
                CategoryId = catAccessories.Id,
                Name = "Tháº¯t LÆ°ng Da Double G Buckle Reversible",
                Slug = "gucci-gucci-double-g-belt",
                Sku = "GUC-BELT-3",
                CollectionName = "Gucci Leather",
                Description = "Tháº¯t LÆ°ng Da Double G Buckle Reversible chÃ­nh hÃ£ng tá»« Gucci. Cháº¿ tÃ¡c tá»« Da bÃ² trÆ¡n 2 máº·t Ä‘en/nÃ¢u, khÃ³a GG máº¡ Ä‘á»“ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 14500000m,
                OriginalPrice = 16000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/gucci/gucci-double-g-belt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/gucci/gucci-double-g-belt.jpg", "/img/brands/gucci/gucci-double-g-belt.jpg", "/img/brands/gucci/gucci-double-g-belt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² trÆ¡n 2 máº·t Ä‘en/nÃ¢u, khÃ³a GG máº¡ Ä‘á»“ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Gucci, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_gucci_gucci_double_g_belt.Variants.Add(new ProductVariant { Sku = "GUC-BELT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 14500000m, StockQuantity = 50 });
            allProducts.Add(prod_gucci_gucci_double_g_belt);
            var prod_gucci_gucci_double_g_sunglasses = new Product
            {
                SellerId = seller_gucci.Id,
                CategoryId = catAccessories.Id,
                Name = "KÃ­nh MÃ¡t Chá»¯ Nháº­t Double G Oversized",
                Slug = "gucci-gucci-double-g-sunglasses",
                Sku = "GUC-SUNG-3",
                CollectionName = "Gucci Eyewear",
                Description = "KÃ­nh MÃ¡t Chá»¯ Nháº­t Double G Oversized chÃ­nh hÃ£ng tá»« Gucci. Cháº¿ tÃ¡c tá»« Gá»ng Acetate Ä‘en bÃ³ng, trÃ²ng chá»‘ng UV400 vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 11500000m,
                OriginalPrice = 13000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/gucci/gucci-double-g-sunglasses.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/gucci/gucci-double-g-sunglasses.jpg", "/img/brands/gucci/gucci-double-g-sunglasses.jpg", "/img/brands/gucci/gucci-double-g-sunglasses.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Gá»ng Acetate Ä‘en bÃ³ng, trÃ²ng chá»‘ng UV400",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Gucci, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_gucci_gucci_double_g_sunglasses.Variants.Add(new ProductVariant { Sku = "GUC-SUNG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 11500000m, StockQuantity = 50 });
            allProducts.Add(prod_gucci_gucci_double_g_sunglasses);
            var prod_gucci_gucci_flora_silk_carre = new Product
            {
                SellerId = seller_gucci.Id,
                CategoryId = catAccessories.Id,
                Name = "KhÄƒn Lá»¥a TÆ¡ Táº±m Flora Silk CarrÃ© 90x90",
                Slug = "gucci-gucci-flora-silk-carre",
                Sku = "GUC-CARR-3",
                CollectionName = "Gucci Flora",
                Description = "KhÄƒn Lá»¥a TÆ¡ Táº±m Flora Silk CarrÃ© 90x90 chÃ­nh hÃ£ng tá»« Gucci. Cháº¿ tÃ¡c tá»« 100% Silk Twill dá»‡t thá»§ cÃ´ng táº¡i Como Ã vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 12500000m,
                OriginalPrice = 14000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/gucci/gucci-flora-silk-carre.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/gucci/gucci-flora-silk-carre.jpg", "/img/brands/gucci/gucci-flora-silk-carre.jpg", "/img/brands/gucci/gucci-flora-silk-carre.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "100% Silk Twill dá»‡t thá»§ cÃ´ng táº¡i Como Ã",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Gucci, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_gucci_gucci_flora_silk_carre.Variants.Add(new ProductVariant { Sku = "GUC-CARR-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 12500000m, StockQuantity = 50 });
            allProducts.Add(prod_gucci_gucci_flora_silk_carre);

            var seller_dior = dbUsers.First(u => u.Email == "dior@gmail.com");
            var prod_dior_lady_dior_medium_cannage = new Product
            {
                SellerId = seller_dior.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Lady Dior Medium Cannage Lambskin",
                Slug = "dior-lady-dior-medium-cannage",
                Sku = "DIO-CANN-3",
                CollectionName = "Lady Dior Heritage",
                Description = "TÃºi XÃ¡ch Lady Dior Medium Cannage Lambskin chÃ­nh hÃ£ng tá»« Christian Dior. Cháº¿ tÃ¡c tá»« Da cá»«u non cháº§n bÃ´ng Cannage, charm D.I.O.R vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 155000000m,
                OriginalPrice = 170000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/dior/lady-dior-medium-cannage.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/dior/lady-dior-medium-cannage.jpg", "/img/brands/dior/lady-dior-medium-cannage.jpg", "/img/brands/dior/lady-dior-medium-cannage.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da cá»«u non cháº§n bÃ´ng Cannage, charm D.I.O.R",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Christian Dior, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_dior_lady_dior_medium_cannage.Variants.Add(new ProductVariant { Sku = "DIO-CANN-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 155000000m, StockQuantity = 50 });
            allProducts.Add(prod_dior_lady_dior_medium_cannage);
            var prod_dior_dior_saddle_bag_black = new Product
            {
                SellerId = seller_dior.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Dior Saddle Bag Black Grained Calfskin",
                Slug = "dior-dior-saddle-bag-black",
                Sku = "DIO-BLAC-3",
                CollectionName = "Dior Saddle Icons",
                Description = "TÃºi XÃ¡ch Dior Saddle Bag Black Grained Calfskin chÃ­nh hÃ£ng tá»« Christian Dior. Cháº¿ tÃ¡c tá»« Da bÃª háº¡t sáº§n, khÃ³a chá»¯ D kim loáº¡i máº¡ vÃ ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 115000000m,
                OriginalPrice = 125000000m,
                DiscountPercent = 8,
                ImageUrl = "/img/brands/dior/dior-saddle-bag-black.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/dior/dior-saddle-bag-black.jpg", "/img/brands/dior/dior-saddle-bag-black.jpg", "/img/brands/dior/dior-saddle-bag-black.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª háº¡t sáº§n, khÃ³a chá»¯ D kim loáº¡i máº¡ vÃ ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Christian Dior, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_dior_dior_saddle_bag_black.Variants.Add(new ProductVariant { Sku = "DIO-BLAC-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 115000000m, StockQuantity = 50 });
            allProducts.Add(prod_dior_dior_saddle_bag_black);
            var prod_dior_dior_book_tote_oblique = new Product
            {
                SellerId = seller_dior.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi Tote Dior Book Tote ThÃªu Oblique Xanh",
                Slug = "dior-dior-book-tote-oblique",
                Sku = "DIO-OBLI-3",
                CollectionName = "Dior Oblique",
                Description = "TÃºi Tote Dior Book Tote ThÃªu Oblique Xanh chÃ­nh hÃ£ng tá»« Christian Dior. Cháº¿ tÃ¡c tá»« Váº£i Canvas thÃªu hÃ ng triá»‡u mÅ©i chá»‰ Oblique vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 88000000m,
                OriginalPrice = 95000000m,
                DiscountPercent = 7,
                ImageUrl = "/img/brands/dior/dior-book-tote-oblique.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/dior/dior-book-tote-oblique.jpg", "/img/brands/dior/dior-book-tote-oblique.jpg", "/img/brands/dior/dior-book-tote-oblique.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i Canvas thÃªu hÃ ng triá»‡u mÅ©i chá»‰ Oblique",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Christian Dior, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_dior_dior_book_tote_oblique.Variants.Add(new ProductVariant { Sku = "DIO-OBLI-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 88000000m, StockQuantity = 50 });
            allProducts.Add(prod_dior_dior_book_tote_oblique);
            var prod_dior_dior_jadior_slingback_pump = new Product
            {
                SellerId = seller_dior.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Cao GÃ³t J'Adior Slingback Technical Fabric",
                Slug = "dior-dior-jadior-slingback-pump",
                Sku = "DIO-PUMP-1",
                CollectionName = "J'Adior Footwear",
                Description = "GiÃ y Cao GÃ³t J'Adior Slingback Technical Fabric chÃ­nh hÃ£ng tá»« Christian Dior. Cháº¿ tÃ¡c tá»« Váº£i dá»‡t ká»¹ thuáº­t, dáº£i ruy bÄƒng thÃªu J'Adior vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 28500000m,
                OriginalPrice = 32000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/dior/dior-jadior-slingback-pump.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/dior/dior-jadior-slingback-pump.jpg", "/img/brands/dior/dior-jadior-slingback-pump.jpg", "/img/brands/dior/dior-jadior-slingback-pump.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i dá»‡t ká»¹ thuáº­t, dáº£i ruy bÄƒng thÃªu J'Adior",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Christian Dior, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_dior_dior_jadior_slingback_pump.Variants.Add(new ProductVariant { Sku = "DIO-PUMP-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 28500000m, StockQuantity = 15 });
            prod_dior_dior_jadior_slingback_pump.Variants.Add(new ProductVariant { Sku = "DIO-PUMP-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 28500000m, StockQuantity = 20 });
            prod_dior_dior_jadior_slingback_pump.Variants.Add(new ProductVariant { Sku = "DIO-PUMP-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 28500000m, StockQuantity = 15 });
            allProducts.Add(prod_dior_dior_jadior_slingback_pump);
            var prod_dior_dior_b27_low_top_sneaker = new Product
            {
                SellerId = seller_dior.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Dior B27 Low-Top Galaxy Leather",
                Slug = "dior-dior-b27-low-top-sneaker",
                Sku = "DIO-SNEA-1",
                CollectionName = "Dior Men Sneaker",
                Description = "GiÃ y Sneaker Dior B27 Low-Top Galaxy Leather chÃ­nh hÃ£ng tá»« Christian Dior. Cháº¿ tÃ¡c tá»« Da bÃª má»‹n tráº¯ng xÃ¡m dáº­p lá»— Oblique Galaxy vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 32500000m,
                OriginalPrice = 36000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/dior/dior-b27-low-top-sneaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/dior/dior-b27-low-top-sneaker.jpg", "/img/brands/dior/dior-b27-low-top-sneaker.jpg", "/img/brands/dior/dior-b27-low-top-sneaker.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª má»‹n tráº¯ng xÃ¡m dáº­p lá»— Oblique Galaxy",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Christian Dior, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_dior_dior_b27_low_top_sneaker.Variants.Add(new ProductVariant { Sku = "DIO-SNEA-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 32500000m, StockQuantity = 15 });
            prod_dior_dior_b27_low_top_sneaker.Variants.Add(new ProductVariant { Sku = "DIO-SNEA-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 32500000m, StockQuantity = 20 });
            prod_dior_dior_b27_low_top_sneaker.Variants.Add(new ProductVariant { Sku = "DIO-SNEA-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 32500000m, StockQuantity = 15 });
            allProducts.Add(prod_dior_dior_b27_low_top_sneaker);
            var prod_dior_dior_bar_jacket_couture = new Product
            {
                SellerId = seller_dior.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c Bar Jacket Len Dáº¡ Haute Couture",
                Slug = "dior-dior-bar-jacket-couture",
                Sku = "DIO-COUT-2",
                CollectionName = "Dior 30 Montaigne",
                Description = "Ão KhoÃ¡c Bar Jacket Len Dáº¡ Haute Couture chÃ­nh hÃ£ng tá»« Christian Dior. Cháº¿ tÃ¡c tá»« Len dáº¡ dá»‡t thá»§ cÃ´ng, eo Ä‘á»“ng há»“ cÃ¡t biá»ƒu tÆ°á»£ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 98000000m,
                OriginalPrice = 110000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/dior/dior-bar-jacket-couture.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/dior/dior-bar-jacket-couture.jpg", "/img/brands/dior/dior-bar-jacket-couture.jpg", "/img/brands/dior/dior-bar-jacket-couture.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Len dáº¡ dá»‡t thá»§ cÃ´ng, eo Ä‘á»“ng há»“ cÃ¡t biá»ƒu tÆ°á»£ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Christian Dior, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_dior_dior_bar_jacket_couture.Variants.Add(new ProductVariant { Sku = "DIO-COUT-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 98000000m, StockQuantity = 15 });
            prod_dior_dior_bar_jacket_couture.Variants.Add(new ProductVariant { Sku = "DIO-COUT-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 98000000m, StockQuantity = 20 });
            prod_dior_dior_bar_jacket_couture.Variants.Add(new ProductVariant { Sku = "DIO-COUT-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 98000000m, StockQuantity = 15 });
            allProducts.Add(prod_dior_dior_bar_jacket_couture);
            var prod_dior_gris_dior_perfume_privee = new Product
            {
                SellerId = seller_dior.Id,
                CategoryId = catAccessories.Id,
                Name = "NÆ°á»›c Hoa Gris Dior La Collection PrivÃ©e 250ml",
                Slug = "dior-gris-dior-perfume-privee",
                Sku = "DIO-PRIV-3",
                CollectionName = "Dior Parfumerie",
                Description = "NÆ°á»›c Hoa Gris Dior La Collection PrivÃ©e 250ml chÃ­nh hÃ£ng tá»« Christian Dior. Cháº¿ tÃ¡c tá»« HÆ°Æ¡ng chypre hoa cá» quÃ½ hiáº¿m gá»— sá»“i & hoáº¯c hÆ°Æ¡ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 12500000m,
                OriginalPrice = 14000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/dior/gris-dior-perfume-privee.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/dior/gris-dior-perfume-privee.jpg", "/img/brands/dior/gris-dior-perfume-privee.jpg", "/img/brands/dior/gris-dior-perfume-privee.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "HÆ°Æ¡ng chypre hoa cá» quÃ½ hiáº¿m gá»— sá»“i & hoáº¯c hÆ°Æ¡ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Christian Dior, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_dior_gris_dior_perfume_privee.Variants.Add(new ProductVariant { Sku = "DIO-PRIV-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 12500000m, StockQuantity = 50 });
            allProducts.Add(prod_dior_gris_dior_perfume_privee);
            var prod_dior_dior_mitzah_silk_scarf = new Product
            {
                SellerId = seller_dior.Id,
                CategoryId = catAccessories.Id,
                Name = "KhÄƒn QuÃ ng Cá»• Mitzah Lá»¥a Toile de Jouy",
                Slug = "dior-dior-mitzah-silk-scarf",
                Sku = "DIO-SCAR-3",
                CollectionName = "Dior Cruise Silk",
                Description = "KhÄƒn QuÃ ng Cá»• Mitzah Lá»¥a Toile de Jouy chÃ­nh hÃ£ng tá»« Christian Dior. Cháº¿ tÃ¡c tá»« 100% Silk Twill in há»a tiáº¿t Toile de Jouy vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 6800000m,
                OriginalPrice = 7500000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/dior/dior-mitzah-silk-scarf.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/dior/dior-mitzah-silk-scarf.jpg", "/img/brands/dior/dior-mitzah-silk-scarf.jpg", "/img/brands/dior/dior-mitzah-silk-scarf.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "100% Silk Twill in há»a tiáº¿t Toile de Jouy",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Christian Dior, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_dior_dior_mitzah_silk_scarf.Variants.Add(new ProductVariant { Sku = "DIO-SCAR-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 6800000m, StockQuantity = 50 });
            allProducts.Add(prod_dior_dior_mitzah_silk_scarf);

            var seller_adidas = dbUsers.First(u => u.Email == "adidas@gmail.com");
            var prod_adidas_adidas_samba_og_classic = new Product
            {
                SellerId = seller_adidas.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Adidas Samba OG Classic Cloud White",
                Slug = "adidas-adidas-samba-og-classic",
                Sku = "ADI-CLAS-1",
                CollectionName = "Adidas Originals Terrace",
                Description = "GiÃ y Adidas Samba OG Classic Cloud White chÃ­nh hÃ£ng tá»« Adidas. Cháº¿ tÃ¡c tá»« Da tháº­t full-grain, mÅ©i T-toe da lá»™n vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2790000m,
                OriginalPrice = 3200000m,
                DiscountPercent = 13,
                ImageUrl = "/img/brands/adidas/adidas-samba-og-classic.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/adidas/adidas-samba-og-classic.jpg", "/img/brands/adidas/adidas-samba-og-classic.jpg", "/img/brands/adidas/adidas-samba-og-classic.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da tháº­t full-grain, mÅ©i T-toe da lá»™n",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Adidas, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_adidas_adidas_samba_og_classic.Variants.Add(new ProductVariant { Sku = "ADI-CLAS-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2790000m, StockQuantity = 15 });
            prod_adidas_adidas_samba_og_classic.Variants.Add(new ProductVariant { Sku = "ADI-CLAS-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2790000m, StockQuantity = 20 });
            prod_adidas_adidas_samba_og_classic.Variants.Add(new ProductVariant { Sku = "ADI-CLAS-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2790000m, StockQuantity = 15 });
            allProducts.Add(prod_adidas_adidas_samba_og_classic);
            var prod_adidas_adidas_gazelle_indoor_black = new Product
            {
                SellerId = seller_adidas.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Adidas Gazelle Indoor Core Black Gum",
                Slug = "adidas-adidas-gazelle-indoor-black",
                Sku = "ADI-BLAC-1",
                CollectionName = "Adidas Originals Indoor",
                Description = "GiÃ y Adidas Gazelle Indoor Core Black Gum chÃ­nh hÃ£ng tá»« Adidas. Cháº¿ tÃ¡c tá»« Da lá»™n má»m cao cáº¥p, Ä‘áº¿ cao su gum bÃ¡n trong vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2950000m,
                OriginalPrice = 3400000m,
                DiscountPercent = 13,
                ImageUrl = "/img/brands/adidas/adidas-gazelle-indoor-black.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/adidas/adidas-gazelle-indoor-black.jpg", "/img/brands/adidas/adidas-gazelle-indoor-black.jpg", "/img/brands/adidas/adidas-gazelle-indoor-black.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da lá»™n má»m cao cáº¥p, Ä‘áº¿ cao su gum bÃ¡n trong",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Adidas, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_adidas_adidas_gazelle_indoor_black.Variants.Add(new ProductVariant { Sku = "ADI-BLAC-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2950000m, StockQuantity = 15 });
            prod_adidas_adidas_gazelle_indoor_black.Variants.Add(new ProductVariant { Sku = "ADI-BLAC-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2950000m, StockQuantity = 20 });
            prod_adidas_adidas_gazelle_indoor_black.Variants.Add(new ProductVariant { Sku = "ADI-BLAC-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2950000m, StockQuantity = 15 });
            allProducts.Add(prod_adidas_adidas_gazelle_indoor_black);
            var prod_adidas_adidas_handball_spezial_pink = new Product
            {
                SellerId = seller_adidas.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Adidas Handball Spezial Clear Pink",
                Slug = "adidas-adidas-handball-spezial-pink",
                Sku = "ADI-PINK-1",
                CollectionName = "Adidas Terrace Special",
                Description = "GiÃ y Adidas Handball Spezial Clear Pink chÃ­nh hÃ£ng tá»« Adidas. Cháº¿ tÃ¡c tá»« Da lá»™n há»“ng pastel, Ä‘áº¿ gum cá»• Ä‘iá»ƒn vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2900000m,
                OriginalPrice = 3300000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/adidas/adidas-handball-spezial-pink.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/adidas/adidas-handball-spezial-pink.jpg", "/img/brands/adidas/adidas-handball-spezial-pink.jpg", "/img/brands/adidas/adidas-handball-spezial-pink.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da lá»™n há»“ng pastel, Ä‘áº¿ gum cá»• Ä‘iá»ƒn",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Adidas, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_adidas_adidas_handball_spezial_pink.Variants.Add(new ProductVariant { Sku = "ADI-PINK-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2900000m, StockQuantity = 15 });
            prod_adidas_adidas_handball_spezial_pink.Variants.Add(new ProductVariant { Sku = "ADI-PINK-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2900000m, StockQuantity = 20 });
            prod_adidas_adidas_handball_spezial_pink.Variants.Add(new ProductVariant { Sku = "ADI-PINK-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2900000m, StockQuantity = 15 });
            allProducts.Add(prod_adidas_adidas_handball_spezial_pink);
            var prod_adidas_adidas_ultraboost_light = new Product
            {
                SellerId = seller_adidas.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Cháº¡y Bá»™ Adidas Ultraboost Light 2026",
                Slug = "adidas-adidas-ultraboost-light",
                Sku = "ADI-LIGH-1",
                CollectionName = "Adidas Performance",
                Description = "GiÃ y Cháº¡y Bá»™ Adidas Ultraboost Light 2026 chÃ­nh hÃ£ng tá»« Adidas. Cháº¿ tÃ¡c tá»« Sá»£i dá»‡t Primeknit+, Ä‘á»‡m Boost hoÃ n tráº£ nÄƒng lÆ°á»£ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 5200000m,
                OriginalPrice = 5800000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/adidas/adidas-ultraboost-light.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/adidas/adidas-ultraboost-light.jpg", "/img/brands/adidas/adidas-ultraboost-light.jpg", "/img/brands/adidas/adidas-ultraboost-light.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Sá»£i dá»‡t Primeknit+, Ä‘á»‡m Boost hoÃ n tráº£ nÄƒng lÆ°á»£ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Adidas, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_adidas_adidas_ultraboost_light.Variants.Add(new ProductVariant { Sku = "ADI-LIGH-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 5200000m, StockQuantity = 15 });
            prod_adidas_adidas_ultraboost_light.Variants.Add(new ProductVariant { Sku = "ADI-LIGH-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 5200000m, StockQuantity = 20 });
            prod_adidas_adidas_ultraboost_light.Variants.Add(new ProductVariant { Sku = "ADI-LIGH-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 5200000m, StockQuantity = 15 });
            allProducts.Add(prod_adidas_adidas_ultraboost_light);
            var prod_adidas_adidas_beckenbauer_tracktop = new Product
            {
                SellerId = seller_adidas.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c Ná»‰ Beckenbauer Tracktop Night Indigo",
                Slug = "adidas-adidas-beckenbauer-tracktop",
                Sku = "ADI-TRAC-2",
                CollectionName = "Adidas Heritage",
                Description = "Ão KhoÃ¡c Ná»‰ Beckenbauer Tracktop Night Indigo chÃ­nh hÃ£ng tá»« Adidas. Cháº¿ tÃ¡c tá»« Váº£i dá»‡t Ä‘Ã´i 52% cotton há»¯u cÆ¡, 48% poly tÃ¡i cháº¿ vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2200000m,
                OriginalPrice = 2600000m,
                DiscountPercent = 15,
                ImageUrl = "/img/brands/adidas/adidas-beckenbauer-tracktop.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/adidas/adidas-beckenbauer-tracktop.jpg", "/img/brands/adidas/adidas-beckenbauer-tracktop.jpg", "/img/brands/adidas/adidas-beckenbauer-tracktop.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i dá»‡t Ä‘Ã´i 52% cotton há»¯u cÆ¡, 48% poly tÃ¡i cháº¿",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Adidas, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_adidas_adidas_beckenbauer_tracktop.Variants.Add(new ProductVariant { Sku = "ADI-TRAC-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 2200000m, StockQuantity = 15 });
            prod_adidas_adidas_beckenbauer_tracktop.Variants.Add(new ProductVariant { Sku = "ADI-TRAC-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 2200000m, StockQuantity = 20 });
            prod_adidas_adidas_beckenbauer_tracktop.Variants.Add(new ProductVariant { Sku = "ADI-TRAC-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 2200000m, StockQuantity = 15 });
            allProducts.Add(prod_adidas_adidas_beckenbauer_tracktop);
            var prod_adidas_adidas_tiro23_training_pants = new Product
            {
                SellerId = seller_adidas.Id,
                CategoryId = catStreetwear.Id,
                Name = "Quáº§n Thá»ƒ Thao Tiro 23 League Training Pants",
                Slug = "adidas-adidas-tiro23-training-pants",
                Sku = "ADI-PANT-2",
                CollectionName = "Adidas Training",
                Description = "Quáº§n Thá»ƒ Thao Tiro 23 League Training Pants chÃ­nh hÃ£ng tá»« Adidas. Cháº¿ tÃ¡c tá»« Váº£i thun cÃ´ng nghá»‡ AEROREADY thoÃ¡t áº©m nhanh vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1350000m,
                OriginalPrice = 1600000m,
                DiscountPercent = 16,
                ImageUrl = "/img/brands/adidas/adidas-tiro23-training-pants.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/adidas/adidas-tiro23-training-pants.jpg", "/img/brands/adidas/adidas-tiro23-training-pants.jpg", "/img/brands/adidas/adidas-tiro23-training-pants.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i thun cÃ´ng nghá»‡ AEROREADY thoÃ¡t áº©m nhanh",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Adidas, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_adidas_adidas_tiro23_training_pants.Variants.Add(new ProductVariant { Sku = "ADI-PANT-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 1350000m, StockQuantity = 15 });
            prod_adidas_adidas_tiro23_training_pants.Variants.Add(new ProductVariant { Sku = "ADI-PANT-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1350000m, StockQuantity = 20 });
            prod_adidas_adidas_tiro23_training_pants.Variants.Add(new ProductVariant { Sku = "ADI-PANT-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1350000m, StockQuantity = 15 });
            allProducts.Add(prod_adidas_adidas_tiro23_training_pants);
            var prod_adidas_adidas_trefoil_hoodie = new Product
            {
                SellerId = seller_adidas.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão Hoodie Trefoil Essentials French Terry",
                Slug = "adidas-adidas-trefoil-hoodie",
                Sku = "ADI-HOOD-2",
                CollectionName = "Adidas Originals",
                Description = "Ão Hoodie Trefoil Essentials French Terry chÃ­nh hÃ£ng tá»« Adidas. Cháº¿ tÃ¡c tá»« Cháº¥t ná»‰ bÃ´ng 100% cotton PhÃ¡p 380gsm dÃ y dáº·n vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1850000m,
                OriginalPrice = 2200000m,
                DiscountPercent = 16,
                ImageUrl = "/img/brands/adidas/adidas-trefoil-hoodie.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/adidas/adidas-trefoil-hoodie.jpg", "/img/brands/adidas/adidas-trefoil-hoodie.jpg", "/img/brands/adidas/adidas-trefoil-hoodie.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Cháº¥t ná»‰ bÃ´ng 100% cotton PhÃ¡p 380gsm dÃ y dáº·n",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Adidas, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_adidas_adidas_trefoil_hoodie.Variants.Add(new ProductVariant { Sku = "ADI-HOOD-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 1850000m, StockQuantity = 15 });
            prod_adidas_adidas_trefoil_hoodie.Variants.Add(new ProductVariant { Sku = "ADI-HOOD-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1850000m, StockQuantity = 20 });
            prod_adidas_adidas_trefoil_hoodie.Variants.Add(new ProductVariant { Sku = "ADI-HOOD-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1850000m, StockQuantity = 15 });
            allProducts.Add(prod_adidas_adidas_trefoil_hoodie);
            var prod_adidas_adidas_adicolor_backpack = new Product
            {
                SellerId = seller_adidas.Id,
                CategoryId = catAccessories.Id,
                Name = "Balo Thá»i Trang Adicolor Classic Trefoil",
                Slug = "adidas-adidas-adicolor-backpack",
                Sku = "ADI-BACK-3",
                CollectionName = "Adidas Accessories",
                Description = "Balo Thá»i Trang Adicolor Classic Trefoil chÃ­nh hÃ£ng tá»« Adidas. Cháº¿ tÃ¡c tá»« Váº£i Poly dá»‡t chá»‘ng nÆ°á»›c nháº¹, quai Ä‘á»‡m Ãªm vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 890000m,
                OriginalPrice = 1100000m,
                DiscountPercent = 19,
                ImageUrl = "/img/brands/adidas/adidas-adicolor-backpack.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/adidas/adidas-adicolor-backpack.jpg", "/img/brands/adidas/adidas-adicolor-backpack.jpg", "/img/brands/adidas/adidas-adicolor-backpack.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i Poly dá»‡t chá»‘ng nÆ°á»›c nháº¹, quai Ä‘á»‡m Ãªm",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Adidas, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_adidas_adidas_adicolor_backpack.Variants.Add(new ProductVariant { Sku = "ADI-BACK-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 890000m, StockQuantity = 50 });
            allProducts.Add(prod_adidas_adidas_adicolor_backpack);

            var seller_louisvuitton = dbUsers.First(u => u.Email == "louisvuitton@gmail.com");
            var prod_louisvuitton_lv_speedy_bandouliere_25 = new Product
            {
                SellerId = seller_louisvuitton.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Speedy BandouliÃ¨re 25 Monogram",
                Slug = "louisvuitton-lv-speedy-bandouliere-25",
                Sku = "LOU-25-3",
                CollectionName = "LV Speedy Heritage",
                Description = "TÃºi XÃ¡ch Speedy BandouliÃ¨re 25 Monogram chÃ­nh hÃ£ng tá»« Louis Vuitton. Cháº¿ tÃ¡c tá»« Canvas Monogram kinh Ä‘iá»ƒn, tay cáº§m da bÃ² tá»± nhiÃªn vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 48500000m,
                OriginalPrice = 55000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/louisvuitton/lv-speedy-bandouliere-25.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/louisvuitton/lv-speedy-bandouliere-25.jpg", "/img/brands/louisvuitton/lv-speedy-bandouliere-25.jpg", "/img/brands/louisvuitton/lv-speedy-bandouliere-25.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Canvas Monogram kinh Ä‘iá»ƒn, tay cáº§m da bÃ² tá»± nhiÃªn",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Louis Vuitton, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_louisvuitton_lv_speedy_bandouliere_25.Variants.Add(new ProductVariant { Sku = "LOU-25-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 48500000m, StockQuantity = 50 });
            allProducts.Add(prod_louisvuitton_lv_speedy_bandouliere_25);
            var prod_louisvuitton_lv_neverfull_mm_monogram = new Product
            {
                SellerId = seller_louisvuitton.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi Tote Neverfull MM Monogram Canvas",
                Slug = "louisvuitton-lv-neverfull-mm-monogram",
                Sku = "LOU-MONO-3",
                CollectionName = "LV Icons",
                Description = "TÃºi Tote Neverfull MM Monogram Canvas chÃ­nh hÃ£ng tá»« Louis Vuitton. Cháº¿ tÃ¡c tá»« Canvas Monogram lÃ³t váº£i sá»c, kÃ¨m vÃ­ pouch thÃ¡o rá»i vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 52000000m,
                OriginalPrice = 58000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/louisvuitton/lv-neverfull-mm-monogram.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/louisvuitton/lv-neverfull-mm-monogram.jpg", "/img/brands/louisvuitton/lv-neverfull-mm-monogram.jpg", "/img/brands/louisvuitton/lv-neverfull-mm-monogram.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Canvas Monogram lÃ³t váº£i sá»c, kÃ¨m vÃ­ pouch thÃ¡o rá»i",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Louis Vuitton, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_louisvuitton_lv_neverfull_mm_monogram.Variants.Add(new ProductVariant { Sku = "LOU-MONO-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 52000000m, StockQuantity = 50 });
            allProducts.Add(prod_louisvuitton_lv_neverfull_mm_monogram);
            var prod_louisvuitton_lv_capucines_mm_taurillon = new Product
            {
                SellerId = seller_louisvuitton.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Capucines MM Da Taurillon Äen",
                Slug = "louisvuitton-lv-capucines-mm-taurillon",
                Sku = "LOU-TAUR-3",
                CollectionName = "LV Capucines",
                Description = "TÃºi XÃ¡ch Capucines MM Da Taurillon Äen chÃ­nh hÃ£ng tá»« Louis Vuitton. Cháº¿ tÃ¡c tá»« Da bÃ² Taurillon cao cáº¥p nguyÃªn táº¥m, logo LV kim loáº¡i vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 185000000m,
                OriginalPrice = 200000000m,
                DiscountPercent = 8,
                ImageUrl = "/img/brands/louisvuitton/lv-capucines-mm-taurillon.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/louisvuitton/lv-capucines-mm-taurillon.jpg", "/img/brands/louisvuitton/lv-capucines-mm-taurillon.jpg", "/img/brands/louisvuitton/lv-capucines-mm-taurillon.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² Taurillon cao cáº¥p nguyÃªn táº¥m, logo LV kim loáº¡i",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Louis Vuitton, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_louisvuitton_lv_capucines_mm_taurillon.Variants.Add(new ProductVariant { Sku = "LOU-TAUR-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 185000000m, StockQuantity = 50 });
            allProducts.Add(prod_louisvuitton_lv_capucines_mm_taurillon);
            var prod_louisvuitton_lv_trainer_sneaker_green = new Product
            {
                SellerId = seller_louisvuitton.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker LV Trainer Green White",
                Slug = "louisvuitton-lv-trainer-sneaker-green",
                Sku = "LOU-GREE-1",
                CollectionName = "LV Trainer by Virgil",
                Description = "GiÃ y Sneaker LV Trainer Green White chÃ­nh hÃ£ng tá»« Louis Vuitton. Cháº¿ tÃ¡c tá»« Thiáº¿t káº¿ cá»§a Virgil Abloh, da bÃª Ã 7 giá» cháº¿ tÃ¡c vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 34500000m,
                OriginalPrice = 38000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/louisvuitton/lv-trainer-sneaker-green.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/louisvuitton/lv-trainer-sneaker-green.jpg", "/img/brands/louisvuitton/lv-trainer-sneaker-green.jpg", "/img/brands/louisvuitton/lv-trainer-sneaker-green.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Thiáº¿t káº¿ cá»§a Virgil Abloh, da bÃª Ã 7 giá» cháº¿ tÃ¡c",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Louis Vuitton, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_louisvuitton_lv_trainer_sneaker_green.Variants.Add(new ProductVariant { Sku = "LOU-GREE-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 34500000m, StockQuantity = 15 });
            prod_louisvuitton_lv_trainer_sneaker_green.Variants.Add(new ProductVariant { Sku = "LOU-GREE-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 34500000m, StockQuantity = 20 });
            prod_louisvuitton_lv_trainer_sneaker_green.Variants.Add(new ProductVariant { Sku = "LOU-GREE-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 34500000m, StockQuantity = 15 });
            allProducts.Add(prod_louisvuitton_lv_trainer_sneaker_green);
            var prod_louisvuitton_lv_run_away_sneaker = new Product
            {
                SellerId = seller_louisvuitton.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Run Away Calf Leather",
                Slug = "louisvuitton-lv-run-away-sneaker",
                Sku = "LOU-SNEA-1",
                CollectionName = "LV Footwear",
                Description = "GiÃ y Sneaker Run Away Calf Leather chÃ­nh hÃ£ng tá»« Louis Vuitton. Cháº¿ tÃ¡c tá»« Phá»‘i da bÃª vÃ  canvas monogram, Ä‘áº¿ nÃ¢ng gÃ³t áº©n vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 29000000m,
                OriginalPrice = 32500000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/louisvuitton/lv-run-away-sneaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/louisvuitton/lv-run-away-sneaker.jpg", "/img/brands/louisvuitton/lv-run-away-sneaker.jpg", "/img/brands/louisvuitton/lv-run-away-sneaker.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Phá»‘i da bÃª vÃ  canvas monogram, Ä‘áº¿ nÃ¢ng gÃ³t áº©n",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Louis Vuitton, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_louisvuitton_lv_run_away_sneaker.Variants.Add(new ProductVariant { Sku = "LOU-SNEA-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 29000000m, StockQuantity = 15 });
            prod_louisvuitton_lv_run_away_sneaker.Variants.Add(new ProductVariant { Sku = "LOU-SNEA-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 29000000m, StockQuantity = 20 });
            prod_louisvuitton_lv_run_away_sneaker.Variants.Add(new ProductVariant { Sku = "LOU-SNEA-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 29000000m, StockQuantity = 15 });
            allProducts.Add(prod_louisvuitton_lv_run_away_sneaker);
            var prod_louisvuitton_lv_monogram_windbreaker = new Product
            {
                SellerId = seller_louisvuitton.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c GiÃ³ Reversible Monogram Windbreaker",
                Slug = "louisvuitton-lv-monogram-windbreaker",
                Sku = "LOU-WIND-2",
                CollectionName = "LV Outerwear",
                Description = "Ão KhoÃ¡c GiÃ³ Reversible Monogram Windbreaker chÃ­nh hÃ£ng tá»« Louis Vuitton. Cháº¿ tÃ¡c tá»« Váº£i ká»¹ thuáº­t chá»‘ng tháº¥m 2 máº·t, há»a tiáº¿t monogram dá»‡t chÃ¬m vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 72000000m,
                OriginalPrice = 80000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/louisvuitton/lv-monogram-windbreaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/louisvuitton/lv-monogram-windbreaker.jpg", "/img/brands/louisvuitton/lv-monogram-windbreaker.jpg", "/img/brands/louisvuitton/lv-monogram-windbreaker.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i ká»¹ thuáº­t chá»‘ng tháº¥m 2 máº·t, há»a tiáº¿t monogram dá»‡t chÃ¬m",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Louis Vuitton, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_louisvuitton_lv_monogram_windbreaker.Variants.Add(new ProductVariant { Sku = "LOU-WIND-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 72000000m, StockQuantity = 15 });
            prod_louisvuitton_lv_monogram_windbreaker.Variants.Add(new ProductVariant { Sku = "LOU-WIND-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 72000000m, StockQuantity = 20 });
            prod_louisvuitton_lv_monogram_windbreaker.Variants.Add(new ProductVariant { Sku = "LOU-WIND-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 72000000m, StockQuantity = 15 });
            allProducts.Add(prod_louisvuitton_lv_monogram_windbreaker);
            var prod_louisvuitton_lv_initiales_40mm_belt = new Product
            {
                SellerId = seller_louisvuitton.Id,
                CategoryId = catAccessories.Id,
                Name = "Tháº¯t LÆ°ng LV Initiales 40mm Reversible",
                Slug = "louisvuitton-lv-initiales-40mm-belt",
                Sku = "LOU-BELT-3",
                CollectionName = "LV Belts",
                Description = "Tháº¯t LÆ°ng LV Initiales 40mm Reversible chÃ­nh hÃ£ng tá»« Louis Vuitton. Cháº¿ tÃ¡c tá»« Máº·t ngoÃ i Monogram Canvas, máº·t trong da bÃª Ä‘en vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 16500000m,
                OriginalPrice = 18500000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/louisvuitton/lv-initiales-40mm-belt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/louisvuitton/lv-initiales-40mm-belt.jpg", "/img/brands/louisvuitton/lv-initiales-40mm-belt.jpg", "/img/brands/louisvuitton/lv-initiales-40mm-belt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Máº·t ngoÃ i Monogram Canvas, máº·t trong da bÃª Ä‘en",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Louis Vuitton, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_louisvuitton_lv_initiales_40mm_belt.Variants.Add(new ProductVariant { Sku = "LOU-BELT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 16500000m, StockQuantity = 50 });
            allProducts.Add(prod_louisvuitton_lv_initiales_40mm_belt);
            var prod_louisvuitton_lv_zippy_wallet_empreinte = new Product
            {
                SellerId = seller_louisvuitton.Id,
                CategoryId = catAccessories.Id,
                Name = "VÃ­ DÃ i Zippy Wallet Da Monogram Empreinte",
                Slug = "louisvuitton-lv-zippy-wallet-empreinte",
                Sku = "LOU-EMPR-3",
                CollectionName = "LV Small Leather",
                Description = "VÃ­ DÃ i Zippy Wallet Da Monogram Empreinte chÃ­nh hÃ£ng tá»« Louis Vuitton. Cháº¿ tÃ¡c tá»« Da bÃ² dáº­p ná»•i há»a tiáº¿t Monogram, khÃ³a kÃ©o kim loáº¡i vÃ ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 27500000m,
                OriginalPrice = 30500000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/louisvuitton/lv-zippy-wallet-empreinte.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/louisvuitton/lv-zippy-wallet-empreinte.jpg", "/img/brands/louisvuitton/lv-zippy-wallet-empreinte.jpg", "/img/brands/louisvuitton/lv-zippy-wallet-empreinte.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² dáº­p ná»•i há»a tiáº¿t Monogram, khÃ³a kÃ©o kim loáº¡i vÃ ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Louis Vuitton, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_louisvuitton_lv_zippy_wallet_empreinte.Variants.Add(new ProductVariant { Sku = "LOU-EMPR-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 27500000m, StockQuantity = 50 });
            allProducts.Add(prod_louisvuitton_lv_zippy_wallet_empreinte);

            var seller_nike = dbUsers.First(u => u.Email == "nike@gmail.com");
            var prod_nike_nike_air_force_1_white = new Product
            {
                SellerId = seller_nike.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Nike Air Force 1 '07 Triple White",
                Slug = "nike-nike-air-force-1-white",
                Sku = "NIK-WHIT-1",
                CollectionName = "Nike Sportswear Icon",
                Description = "GiÃ y Nike Air Force 1 '07 Triple White chÃ­nh hÃ£ng tá»« Nike. Cháº¿ tÃ¡c tá»« Da tháº­t full-grain, Ä‘á»‡m khÃ­ Nike Air Ãªm Ã¡i vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2990000m,
                OriginalPrice = 3400000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/nike/nike-air-force-1-white.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/nike/nike-air-force-1-white.jpg", "/img/brands/nike/nike-air-force-1-white.jpg", "/img/brands/nike/nike-air-force-1-white.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da tháº­t full-grain, Ä‘á»‡m khÃ­ Nike Air Ãªm Ã¡i",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Nike, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_nike_nike_air_force_1_white.Variants.Add(new ProductVariant { Sku = "NIK-WHIT-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2990000m, StockQuantity = 15 });
            prod_nike_nike_air_force_1_white.Variants.Add(new ProductVariant { Sku = "NIK-WHIT-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2990000m, StockQuantity = 20 });
            prod_nike_nike_air_force_1_white.Variants.Add(new ProductVariant { Sku = "NIK-WHIT-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2990000m, StockQuantity = 15 });
            allProducts.Add(prod_nike_nike_air_force_1_white);
            var prod_nike_nike_air_jordan_1_retro_chicago = new Product
            {
                SellerId = seller_nike.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Nike Air Jordan 1 Retro High OG Chicago",
                Slug = "nike-nike-air-jordan-1-retro-chicago",
                Sku = "NIK-CHIC-1",
                CollectionName = "Jordan Brand Heritage",
                Description = "GiÃ y Nike Air Jordan 1 Retro High OG Chicago chÃ­nh hÃ£ng tá»« Nike. Cháº¿ tÃ¡c tá»« PhiÃªn báº£n mÃ u Chicago kinh Ä‘iá»ƒn da Nappa cao cáº¥p vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 5500000m,
                OriginalPrice = 6200000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/nike/nike-air-jordan-1-retro-chicago.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/nike/nike-air-jordan-1-retro-chicago.jpg", "/img/brands/nike/nike-air-jordan-1-retro-chicago.jpg", "/img/brands/nike/nike-air-jordan-1-retro-chicago.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "PhiÃªn báº£n mÃ u Chicago kinh Ä‘iá»ƒn da Nappa cao cáº¥p",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Nike, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_nike_nike_air_jordan_1_retro_chicago.Variants.Add(new ProductVariant { Sku = "NIK-CHIC-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 5500000m, StockQuantity = 15 });
            prod_nike_nike_air_jordan_1_retro_chicago.Variants.Add(new ProductVariant { Sku = "NIK-CHIC-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 5500000m, StockQuantity = 20 });
            prod_nike_nike_air_jordan_1_retro_chicago.Variants.Add(new ProductVariant { Sku = "NIK-CHIC-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 5500000m, StockQuantity = 15 });
            allProducts.Add(prod_nike_nike_air_jordan_1_retro_chicago);
            var prod_nike_nike_dunk_low_retro_panda = new Product
            {
                SellerId = seller_nike.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Nike Dunk Low Retro White Black Panda",
                Slug = "nike-nike-dunk-low-retro-panda",
                Sku = "NIK-PAND-1",
                CollectionName = "Nike Dunk Legacy",
                Description = "GiÃ y Nike Dunk Low Retro White Black Panda chÃ­nh hÃ£ng tá»« Nike. Cháº¿ tÃ¡c tá»« Phá»‘i mÃ u tráº¯ng Ä‘en Panda biá»ƒu tÆ°á»£ng streetwear vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2890000m,
                OriginalPrice = 3300000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/nike/nike-dunk-low-retro-panda.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/nike/nike-dunk-low-retro-panda.jpg", "/img/brands/nike/nike-dunk-low-retro-panda.jpg", "/img/brands/nike/nike-dunk-low-retro-panda.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Phá»‘i mÃ u tráº¯ng Ä‘en Panda biá»ƒu tÆ°á»£ng streetwear",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Nike, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_nike_nike_dunk_low_retro_panda.Variants.Add(new ProductVariant { Sku = "NIK-PAND-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2890000m, StockQuantity = 15 });
            prod_nike_nike_dunk_low_retro_panda.Variants.Add(new ProductVariant { Sku = "NIK-PAND-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2890000m, StockQuantity = 20 });
            prod_nike_nike_dunk_low_retro_panda.Variants.Add(new ProductVariant { Sku = "NIK-PAND-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2890000m, StockQuantity = 15 });
            allProducts.Add(prod_nike_nike_dunk_low_retro_panda);
            var prod_nike_nike_air_zoom_alphafly_next = new Product
            {
                SellerId = seller_nike.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Cháº¡y Bá»™ Nike Air Zoom Alphafly NEXT% 3",
                Slug = "nike-nike-air-zoom-alphafly-next",
                Sku = "NIK-NEXT-1",
                CollectionName = "Nike Running Elite",
                Description = "GiÃ y Cháº¡y Bá»™ Nike Air Zoom Alphafly NEXT% 3 chÃ­nh hÃ£ng tá»« Nike. Cháº¿ tÃ¡c tá»« Äáº¿ Ä‘á»‡m bá»t ZoomX & Ä‘Ä©a Ä‘á»‡m sá»£i carbon Flyplate vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 7890000m,
                OriginalPrice = 8500000m,
                DiscountPercent = 7,
                ImageUrl = "/img/brands/nike/nike-air-zoom-alphafly-next.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/nike/nike-air-zoom-alphafly-next.jpg", "/img/brands/nike/nike-air-zoom-alphafly-next.jpg", "/img/brands/nike/nike-air-zoom-alphafly-next.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Äáº¿ Ä‘á»‡m bá»t ZoomX & Ä‘Ä©a Ä‘á»‡m sá»£i carbon Flyplate",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Nike, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_nike_nike_air_zoom_alphafly_next.Variants.Add(new ProductVariant { Sku = "NIK-NEXT-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 7890000m, StockQuantity = 15 });
            prod_nike_nike_air_zoom_alphafly_next.Variants.Add(new ProductVariant { Sku = "NIK-NEXT-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 7890000m, StockQuantity = 20 });
            prod_nike_nike_air_zoom_alphafly_next.Variants.Add(new ProductVariant { Sku = "NIK-NEXT-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 7890000m, StockQuantity = 15 });
            allProducts.Add(prod_nike_nike_air_zoom_alphafly_next);
            var prod_nike_nike_tech_fleece_windrunner = new Product
            {
                SellerId = seller_nike.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c Ná»‰ Nike Tech Fleece Full-Zip Windrunner",
                Slug = "nike-nike-tech-fleece-windrunner",
                Sku = "NIK-WIND-2",
                CollectionName = "Nike Tech Pack",
                Description = "Ão KhoÃ¡c Ná»‰ Nike Tech Fleece Full-Zip Windrunner chÃ­nh hÃ£ng tá»« Nike. Cháº¿ tÃ¡c tá»« Cháº¥t ná»‰ cÃ¡ch nhiá»‡t Tech Fleece nháº¹ vÃ  áº¥m vÆ°á»£t trá»™i vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2850000m,
                OriginalPrice = 3300000m,
                DiscountPercent = 14,
                ImageUrl = "/img/brands/nike/nike-tech-fleece-windrunner.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/nike/nike-tech-fleece-windrunner.jpg", "/img/brands/nike/nike-tech-fleece-windrunner.jpg", "/img/brands/nike/nike-tech-fleece-windrunner.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Cháº¥t ná»‰ cÃ¡ch nhiá»‡t Tech Fleece nháº¹ vÃ  áº¥m vÆ°á»£t trá»™i",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Nike, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_nike_nike_tech_fleece_windrunner.Variants.Add(new ProductVariant { Sku = "NIK-WIND-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 2850000m, StockQuantity = 15 });
            prod_nike_nike_tech_fleece_windrunner.Variants.Add(new ProductVariant { Sku = "NIK-WIND-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 2850000m, StockQuantity = 20 });
            prod_nike_nike_tech_fleece_windrunner.Variants.Add(new ProductVariant { Sku = "NIK-WIND-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 2850000m, StockQuantity = 15 });
            allProducts.Add(prod_nike_nike_tech_fleece_windrunner);
            var prod_nike_nike_club_fleece_cargo_pants = new Product
            {
                SellerId = seller_nike.Id,
                CategoryId = catStreetwear.Id,
                Name = "Quáº§n Ná»‰ Thá»ƒ Thao Nike Club Fleece Cargo Pants",
                Slug = "nike-nike-club-fleece-cargo-pants",
                Sku = "NIK-PANT-2",
                CollectionName = "Nike Club Fleece",
                Description = "Quáº§n Ná»‰ Thá»ƒ Thao Nike Club Fleece Cargo Pants chÃ­nh hÃ£ng tá»« Nike. Cháº¿ tÃ¡c tá»« Váº£i ná»‰ bÃ´ng má»m máº¡i, tÃºi há»™p tiá»‡n dá»¥ng thá»ƒ thao vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1650000m,
                OriginalPrice = 1950000m,
                DiscountPercent = 15,
                ImageUrl = "/img/brands/nike/nike-club-fleece-cargo-pants.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/nike/nike-club-fleece-cargo-pants.jpg", "/img/brands/nike/nike-club-fleece-cargo-pants.jpg", "/img/brands/nike/nike-club-fleece-cargo-pants.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i ná»‰ bÃ´ng má»m máº¡i, tÃºi há»™p tiá»‡n dá»¥ng thá»ƒ thao",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Nike, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_nike_nike_club_fleece_cargo_pants.Variants.Add(new ProductVariant { Sku = "NIK-PANT-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 1650000m, StockQuantity = 15 });
            prod_nike_nike_club_fleece_cargo_pants.Variants.Add(new ProductVariant { Sku = "NIK-PANT-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1650000m, StockQuantity = 20 });
            prod_nike_nike_club_fleece_cargo_pants.Variants.Add(new ProductVariant { Sku = "NIK-PANT-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1650000m, StockQuantity = 15 });
            allProducts.Add(prod_nike_nike_club_fleece_cargo_pants);
            var prod_nike_nike_windrunner_jacket = new Product
            {
                SellerId = seller_nike.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão GiÃ³ Cháº¡y Bá»™ Nike Windrunner Repel Jacket",
                Slug = "nike-nike-windrunner-jacket",
                Sku = "NIK-JACK-2",
                CollectionName = "Nike Running Essentials",
                Description = "Ão GiÃ³ Cháº¡y Bá»™ Nike Windrunner Repel Jacket chÃ­nh hÃ£ng tá»« Nike. Cháº¿ tÃ¡c tá»« Váº£i dá»‡t chevron 26 Ä‘á»™ chá»‘ng tháº¥m nÆ°á»›c nháº¹ vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2450000m,
                OriginalPrice = 2900000m,
                DiscountPercent = 16,
                ImageUrl = "/img/brands/nike/nike-windrunner-jacket.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/nike/nike-windrunner-jacket.jpg", "/img/brands/nike/nike-windrunner-jacket.jpg", "/img/brands/nike/nike-windrunner-jacket.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i dá»‡t chevron 26 Ä‘á»™ chá»‘ng tháº¥m nÆ°á»›c nháº¹",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Nike, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_nike_nike_windrunner_jacket.Variants.Add(new ProductVariant { Sku = "NIK-JACK-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 2450000m, StockQuantity = 15 });
            prod_nike_nike_windrunner_jacket.Variants.Add(new ProductVariant { Sku = "NIK-JACK-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 2450000m, StockQuantity = 20 });
            prod_nike_nike_windrunner_jacket.Variants.Add(new ProductVariant { Sku = "NIK-JACK-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 2450000m, StockQuantity = 15 });
            allProducts.Add(prod_nike_nike_windrunner_jacket);
            var prod_nike_nike_heritage_crossbody_bag = new Product
            {
                SellerId = seller_nike.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi Äeo ChÃ©o Thá»ƒ Thao Nike Heritage Crossbody Bag",
                Slug = "nike-nike-heritage-crossbody-bag",
                Sku = "NIK-BAG-3",
                CollectionName = "Nike Accessories",
                Description = "TÃºi Äeo ChÃ©o Thá»ƒ Thao Nike Heritage Crossbody Bag chÃ­nh hÃ£ng tá»« Nike. Cháº¿ tÃ¡c tá»« Váº£i poly bá»n bá»‰, dÃ¢y Ä‘eo Ä‘iá»u chá»‰nh linh hoáº¡t vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 750000m,
                OriginalPrice = 950000m,
                DiscountPercent = 21,
                ImageUrl = "/img/brands/nike/nike-heritage-crossbody-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/nike/nike-heritage-crossbody-bag.jpg", "/img/brands/nike/nike-heritage-crossbody-bag.jpg", "/img/brands/nike/nike-heritage-crossbody-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i poly bá»n bá»‰, dÃ¢y Ä‘eo Ä‘iá»u chá»‰nh linh hoáº¡t",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Nike, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_nike_nike_heritage_crossbody_bag.Variants.Add(new ProductVariant { Sku = "NIK-BAG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 750000m, StockQuantity = 50 });
            allProducts.Add(prod_nike_nike_heritage_crossbody_bag);

            var seller_chanel = dbUsers.First(u => u.Email == "chanel@gmail.com");
            var prod_chanel_chanel_classic_flap_bag = new Product
            {
                SellerId = seller_chanel.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Classic Flap Bag Lambskin Black",
                Slug = "chanel-chanel-classic-flap-bag",
                Sku = "CHA-BAG-3",
                CollectionName = "Chanel Timeless Classic",
                Description = "TÃºi XÃ¡ch Classic Flap Bag Lambskin Black chÃ­nh hÃ£ng tá»« Chanel. Cháº¿ tÃ¡c tá»« Da cá»«u non cháº§n quáº£ trÃ¡m, khÃ³a xoay CC máº¡ vÃ ng 24K vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 260000000m,
                OriginalPrice = 280000000m,
                DiscountPercent = 7,
                ImageUrl = "/img/brands/chanel/chanel-classic-flap-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/chanel/chanel-classic-flap-bag.jpg", "/img/brands/chanel/chanel-classic-flap-bag.jpg", "/img/brands/chanel/chanel-classic-flap-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da cá»«u non cháº§n quáº£ trÃ¡m, khÃ³a xoay CC máº¡ vÃ ng 24K",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Chanel, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_chanel_chanel_classic_flap_bag.Variants.Add(new ProductVariant { Sku = "CHA-BAG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 260000000m, StockQuantity = 50 });
            allProducts.Add(prod_chanel_chanel_classic_flap_bag);
            var prod_chanel_chanel_boy_quilted_bag = new Product
            {
                SellerId = seller_chanel.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Boy Chanel Quilted Calfskin",
                Slug = "chanel-chanel-boy-quilted-bag",
                Sku = "CHA-BAG-4",
                CollectionName = "Boy Chanel Icons",
                Description = "TÃºi XÃ¡ch Boy Chanel Quilted Calfskin chÃ­nh hÃ£ng tá»« Chanel. Cháº¿ tÃ¡c tá»« Da bÃª háº¡t sáº§n cao cáº¥p, khÃ³a báº¥m kim loáº¡i ruthenium vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 175000000m,
                OriginalPrice = 190000000m,
                DiscountPercent = 8,
                ImageUrl = "/img/brands/chanel/chanel-boy-quilted-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/chanel/chanel-boy-quilted-bag.jpg", "/img/brands/chanel/chanel-boy-quilted-bag.jpg", "/img/brands/chanel/chanel-boy-quilted-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª háº¡t sáº§n cao cáº¥p, khÃ³a báº¥m kim loáº¡i ruthenium",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Chanel, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_chanel_chanel_boy_quilted_bag.Variants.Add(new ProductVariant { Sku = "CHA-BAG-4-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 175000000m, StockQuantity = 50 });
            allProducts.Add(prod_chanel_chanel_boy_quilted_bag);
            var prod_chanel_chanel_tweed_boucle_jacket = new Product
            {
                SellerId = seller_chanel.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c Dáº¡ Tweed BouclÃ© Haute Couture",
                Slug = "chanel-chanel-tweed-boucle-jacket",
                Sku = "CHA-JACK-2",
                CollectionName = "Chanel Ready-to-Wear",
                Description = "Ão KhoÃ¡c Dáº¡ Tweed BouclÃ© Haute Couture chÃ­nh hÃ£ng tá»« Chanel. Cháº¿ tÃ¡c tá»« Váº£i Tweed dá»‡t thá»§ cÃ´ng Lesage Paris, cÃºc cháº¡m sÆ° tá»­ vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 145000000m,
                OriginalPrice = 160000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/chanel/chanel-tweed-boucle-jacket.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/chanel/chanel-tweed-boucle-jacket.jpg", "/img/brands/chanel/chanel-tweed-boucle-jacket.jpg", "/img/brands/chanel/chanel-tweed-boucle-jacket.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i Tweed dá»‡t thá»§ cÃ´ng Lesage Paris, cÃºc cháº¡m sÆ° tá»­",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Chanel, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_chanel_chanel_tweed_boucle_jacket.Variants.Add(new ProductVariant { Sku = "CHA-JACK-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 145000000m, StockQuantity = 15 });
            prod_chanel_chanel_tweed_boucle_jacket.Variants.Add(new ProductVariant { Sku = "CHA-JACK-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 145000000m, StockQuantity = 20 });
            prod_chanel_chanel_tweed_boucle_jacket.Variants.Add(new ProductVariant { Sku = "CHA-JACK-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 145000000m, StockQuantity = 15 });
            allProducts.Add(prod_chanel_chanel_tweed_boucle_jacket);
            var prod_chanel_chanel_coco_mademoiselle_perfume = new Product
            {
                SellerId = seller_chanel.Id,
                CategoryId = catAccessories.Id,
                Name = "NÆ°á»›c Hoa Chanel Coco Mademoiselle Intense 100ml",
                Slug = "chanel-chanel-coco-mademoiselle-perfume",
                Sku = "CHA-PERF-3",
                CollectionName = "Chanel Fragrance",
                Description = "NÆ°á»›c Hoa Chanel Coco Mademoiselle Intense 100ml chÃ­nh hÃ£ng tá»« Chanel. Cháº¿ tÃ¡c tá»« HÆ°Æ¡ng hoáº¯c hÆ°Æ¡ng, hoa há»“ng Thá»• NhÄ© Ká»³ vÃ  cam Bergamot vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 4950000m,
                OriginalPrice = 5500000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/chanel/chanel-coco-mademoiselle-perfume.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/chanel/chanel-coco-mademoiselle-perfume.jpg", "/img/brands/chanel/chanel-coco-mademoiselle-perfume.jpg", "/img/brands/chanel/chanel-coco-mademoiselle-perfume.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "HÆ°Æ¡ng hoáº¯c hÆ°Æ¡ng, hoa há»“ng Thá»• NhÄ© Ká»³ vÃ  cam Bergamot",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Chanel, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_chanel_chanel_coco_mademoiselle_perfume.Variants.Add(new ProductVariant { Sku = "CHA-PERF-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 4950000m, StockQuantity = 50 });
            allProducts.Add(prod_chanel_chanel_coco_mademoiselle_perfume);
            var prod_chanel_chanel_two_tone_slingback = new Product
            {
                SellerId = seller_chanel.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Slingback Two-Tone Beige Black Goat Leather",
                Slug = "chanel-chanel-two-tone-slingback",
                Sku = "CHA-SLIN-1",
                CollectionName = "Chanel Footwear",
                Description = "GiÃ y Slingback Two-Tone Beige Black Goat Leather chÃ­nh hÃ£ng tá»« Chanel. Cháº¿ tÃ¡c tá»« Da dÃª phá»‘i mÅ©i lá»¥a Ä‘en huyá»n thoáº¡i Gabrielle Chanel 1957 vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 29500000m,
                OriginalPrice = 33000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/chanel/chanel-two-tone-slingback.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/chanel/chanel-two-tone-slingback.jpg", "/img/brands/chanel/chanel-two-tone-slingback.jpg", "/img/brands/chanel/chanel-two-tone-slingback.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da dÃª phá»‘i mÅ©i lá»¥a Ä‘en huyá»n thoáº¡i Gabrielle Chanel 1957",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Chanel, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_chanel_chanel_two_tone_slingback.Variants.Add(new ProductVariant { Sku = "CHA-SLIN-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 29500000m, StockQuantity = 15 });
            prod_chanel_chanel_two_tone_slingback.Variants.Add(new ProductVariant { Sku = "CHA-SLIN-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 29500000m, StockQuantity = 20 });
            prod_chanel_chanel_two_tone_slingback.Variants.Add(new ProductVariant { Sku = "CHA-SLIN-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 29500000m, StockQuantity = 15 });
            allProducts.Add(prod_chanel_chanel_two_tone_slingback);
            var prod_chanel_chanel_j12_ceramic_watch = new Product
            {
                SellerId = seller_chanel.Id,
                CategoryId = catAccessories.Id,
                Name = "Äá»“ng Há»“ J12 Ceramic Diamond Bezel Automatic",
                Slug = "chanel-chanel-j12-ceramic-watch",
                Sku = "CHA-WATC-3",
                CollectionName = "Chanel Horlogerie",
                Description = "Äá»“ng Há»“ J12 Ceramic Diamond Bezel Automatic chÃ­nh hÃ£ng tá»« Chanel. Cháº¿ tÃ¡c tá»« Ceramic cÃ´ng nghá»‡ cao chá»‘ng tráº§y, bá»™ mÃ¡y Caliber 12.1 vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 220000000m,
                OriginalPrice = 240000000m,
                DiscountPercent = 8,
                ImageUrl = "/img/brands/chanel/chanel-j12-ceramic-watch.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/chanel/chanel-j12-ceramic-watch.jpg", "/img/brands/chanel/chanel-j12-ceramic-watch.jpg", "/img/brands/chanel/chanel-j12-ceramic-watch.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Ceramic cÃ´ng nghá»‡ cao chá»‘ng tráº§y, bá»™ mÃ¡y Caliber 12.1",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Chanel, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_chanel_chanel_j12_ceramic_watch.Variants.Add(new ProductVariant { Sku = "CHA-WATC-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 220000000m, StockQuantity = 50 });
            allProducts.Add(prod_chanel_chanel_j12_ceramic_watch);
            var prod_chanel_chanel_quilted_leather_wallet = new Product
            {
                SellerId = seller_chanel.Id,
                CategoryId = catAccessories.Id,
                Name = "VÃ­ Gáº­p Cáº§m Tay Quilted Caviar Flap Wallet",
                Slug = "chanel-chanel-quilted-leather-wallet",
                Sku = "CHA-WALL-3",
                CollectionName = "Chanel Small Leather",
                Description = "VÃ­ Gáº­p Cáº§m Tay Quilted Caviar Flap Wallet chÃ­nh hÃ£ng tá»« Chanel. Cháº¿ tÃ¡c tá»« Da háº¡t Caviar chá»‘ng xÆ°á»›c, logo CC vÃ ng tinh xáº£o vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 31000000m,
                OriginalPrice = 35000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/chanel/chanel-quilted-leather-wallet.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/chanel/chanel-quilted-leather-wallet.jpg", "/img/brands/chanel/chanel-quilted-leather-wallet.jpg", "/img/brands/chanel/chanel-quilted-leather-wallet.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da háº¡t Caviar chá»‘ng xÆ°á»›c, logo CC vÃ ng tinh xáº£o",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Chanel, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_chanel_chanel_quilted_leather_wallet.Variants.Add(new ProductVariant { Sku = "CHA-WALL-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 31000000m, StockQuantity = 50 });
            allProducts.Add(prod_chanel_chanel_quilted_leather_wallet);
            var prod_chanel_chanel_camellia_silk_scarf = new Product
            {
                SellerId = seller_chanel.Id,
                CategoryId = catAccessories.Id,
                Name = "KhÄƒn Lá»¥a TÆ¡ Táº±m Camellia Silk Twill 90x90",
                Slug = "chanel-chanel-camellia-silk-scarf",
                Sku = "CHA-SCAR-3",
                CollectionName = "Chanel Silk Foulards",
                Description = "KhÄƒn Lá»¥a TÆ¡ Táº±m Camellia Silk Twill 90x90 chÃ­nh hÃ£ng tá»« Chanel. Cháº¿ tÃ¡c tá»« 100% Silk Twill dá»‡t táº¡i PhÃ¡p, há»a tiáº¿t hoa trÃ  Camellia vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 14500000m,
                OriginalPrice = 16500000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/chanel/chanel-camellia-silk-scarf.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/chanel/chanel-camellia-silk-scarf.jpg", "/img/brands/chanel/chanel-camellia-silk-scarf.jpg", "/img/brands/chanel/chanel-camellia-silk-scarf.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "100% Silk Twill dá»‡t táº¡i PhÃ¡p, há»a tiáº¿t hoa trÃ  Camellia",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Chanel, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_chanel_chanel_camellia_silk_scarf.Variants.Add(new ProductVariant { Sku = "CHA-SCAR-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 14500000m, StockQuantity = 50 });
            allProducts.Add(prod_chanel_chanel_camellia_silk_scarf);

            var seller_prada = dbUsers.First(u => u.Email == "prada@gmail.com");
            var prod_prada_prada_re_edition_2005_nylon = new Product
            {
                SellerId = seller_prada.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Re-Edition 2005 Re-Nylon Shoulder Bag",
                Slug = "prada-prada-re-edition-2005-nylon",
                Sku = "PRA-NYLO-3",
                CollectionName = "Prada Re-Edition",
                Description = "TÃºi XÃ¡ch Re-Edition 2005 Re-Nylon Shoulder Bag chÃ­nh hÃ£ng tá»« Prada. Cháº¿ tÃ¡c tá»« Cháº¥t liá»‡u Re-Nylon tÃ¡i cháº¿ Ä‘áº¡i dÆ°Æ¡ng, quai da Saffiano vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 45000000m,
                OriginalPrice = 50000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/prada/prada-re-edition-2005-nylon.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/prada/prada-re-edition-2005-nylon.jpg", "/img/brands/prada/prada-re-edition-2005-nylon.jpg", "/img/brands/prada/prada-re-edition-2005-nylon.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Cháº¥t liá»‡u Re-Nylon tÃ¡i cháº¿ Ä‘áº¡i dÆ°Æ¡ng, quai da Saffiano",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Prada, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_prada_prada_re_edition_2005_nylon.Variants.Add(new ProductVariant { Sku = "PRA-NYLO-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 45000000m, StockQuantity = 50 });
            allProducts.Add(prod_prada_prada_re_edition_2005_nylon);
            var prod_prada_prada_cleo_brushed_shoulder_bag = new Product
            {
                SellerId = seller_prada.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi Káº¹p NÃ¡ch Cleo Brushed Leather Shoulder Bag",
                Slug = "prada-prada-cleo-brushed-shoulder-bag",
                Sku = "PRA-BAG-3",
                CollectionName = "Prada Cleo Icons",
                Description = "TÃºi Káº¹p NÃ¡ch Cleo Brushed Leather Shoulder Bag chÃ­nh hÃ£ng tá»« Prada. Cháº¿ tÃ¡c tá»« Da bÃª bÃ³ng Spazzolato uá»‘n cong duyÃªn dÃ¡ng Milan vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 75000000m,
                OriginalPrice = 82000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/prada/prada-cleo-brushed-shoulder-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/prada/prada-cleo-brushed-shoulder-bag.jpg", "/img/brands/prada/prada-cleo-brushed-shoulder-bag.jpg", "/img/brands/prada/prada-cleo-brushed-shoulder-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª bÃ³ng Spazzolato uá»‘n cong duyÃªn dÃ¡ng Milan",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Prada, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_prada_prada_cleo_brushed_shoulder_bag.Variants.Add(new ProductVariant { Sku = "PRA-BAG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 75000000m, StockQuantity = 50 });
            allProducts.Add(prod_prada_prada_cleo_brushed_shoulder_bag);
            var prod_prada_prada_monolith_combat_boots = new Product
            {
                SellerId = seller_prada.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Combat Boots Monolith Leather & Nylon",
                Slug = "prada-prada-monolith-combat-boots",
                Sku = "PRA-BOOT-1",
                CollectionName = "Prada Monolith Footwear",
                Description = "GiÃ y Combat Boots Monolith Leather & Nylon chÃ­nh hÃ£ng tá»« Prada. Cháº¿ tÃ¡c tá»« Äáº¿ rÄƒng cÆ°a háº§m há»‘ kÃ¨m vÃ­ pouch gáº¯n báº¯p chÃ¢n thÃ¡o rá»i vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 38000000m,
                OriginalPrice = 42000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/prada/prada-monolith-combat-boots.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/prada/prada-monolith-combat-boots.jpg", "/img/brands/prada/prada-monolith-combat-boots.jpg", "/img/brands/prada/prada-monolith-combat-boots.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Äáº¿ rÄƒng cÆ°a háº§m há»‘ kÃ¨m vÃ­ pouch gáº¯n báº¯p chÃ¢n thÃ¡o rá»i",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Prada, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_prada_prada_monolith_combat_boots.Variants.Add(new ProductVariant { Sku = "PRA-BOOT-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 38000000m, StockQuantity = 15 });
            prod_prada_prada_monolith_combat_boots.Variants.Add(new ProductVariant { Sku = "PRA-BOOT-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 38000000m, StockQuantity = 20 });
            prod_prada_prada_monolith_combat_boots.Variants.Add(new ProductVariant { Sku = "PRA-BOOT-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 38000000m, StockQuantity = 15 });
            allProducts.Add(prod_prada_prada_monolith_combat_boots);
            var prod_prada_prada_chocolate_brushed_loafers = new Product
            {
                SellerId = seller_prada.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Loafer Chocolate Brushed Leather With Triangle",
                Slug = "prada-prada-chocolate-brushed-loafers",
                Sku = "PRA-LOAF-1",
                CollectionName = "Prada Footwear",
                Description = "GiÃ y Loafer Chocolate Brushed Leather With Triangle chÃ­nh hÃ£ng tá»« Prada. Cháº¿ tÃ¡c tá»« Da bÃ³ng má»‹n Ä‘Ã­nh logo tam giÃ¡c trÃ¡ng men Men Milan vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 31500000m,
                OriginalPrice = 35000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/prada/prada-chocolate-brushed-loafers.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/prada/prada-chocolate-brushed-loafers.jpg", "/img/brands/prada/prada-chocolate-brushed-loafers.jpg", "/img/brands/prada/prada-chocolate-brushed-loafers.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ³ng má»‹n Ä‘Ã­nh logo tam giÃ¡c trÃ¡ng men Men Milan",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Prada, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_prada_prada_chocolate_brushed_loafers.Variants.Add(new ProductVariant { Sku = "PRA-LOAF-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 31500000m, StockQuantity = 15 });
            prod_prada_prada_chocolate_brushed_loafers.Variants.Add(new ProductVariant { Sku = "PRA-LOAF-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 31500000m, StockQuantity = 20 });
            prod_prada_prada_chocolate_brushed_loafers.Variants.Add(new ProductVariant { Sku = "PRA-LOAF-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 31500000m, StockQuantity = 15 });
            allProducts.Add(prod_prada_prada_chocolate_brushed_loafers);
            var prod_prada_prada_re_nylon_cropped_jacket = new Product
            {
                SellerId = seller_prada.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c Phao Re-Nylon Cropped Down Jacket",
                Slug = "prada-prada-re-nylon-cropped-jacket",
                Sku = "PRA-JACK-2",
                CollectionName = "Prada Ready-to-Wear",
                Description = "Ão KhoÃ¡c Phao Re-Nylon Cropped Down Jacket chÃ­nh hÃ£ng tá»« Prada. Cháº¿ tÃ¡c tá»« Váº£i Re-Nylon chá»‘ng tháº¥m, lÃ´ng vÅ© tÆ¡ táº±m siÃªu nháº¹ vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 65000000m,
                OriginalPrice = 72000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/prada/prada-re-nylon-cropped-jacket.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/prada/prada-re-nylon-cropped-jacket.jpg", "/img/brands/prada/prada-re-nylon-cropped-jacket.jpg", "/img/brands/prada/prada-re-nylon-cropped-jacket.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i Re-Nylon chá»‘ng tháº¥m, lÃ´ng vÅ© tÆ¡ táº±m siÃªu nháº¹",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Prada, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_prada_prada_re_nylon_cropped_jacket.Variants.Add(new ProductVariant { Sku = "PRA-JACK-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 65000000m, StockQuantity = 15 });
            prod_prada_prada_re_nylon_cropped_jacket.Variants.Add(new ProductVariant { Sku = "PRA-JACK-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 65000000m, StockQuantity = 20 });
            prod_prada_prada_re_nylon_cropped_jacket.Variants.Add(new ProductVariant { Sku = "PRA-JACK-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 65000000m, StockQuantity = 15 });
            allProducts.Add(prod_prada_prada_re_nylon_cropped_jacket);
            var prod_prada_prada_triangle_logo_belt = new Product
            {
                SellerId = seller_prada.Id,
                CategoryId = catAccessories.Id,
                Name = "Tháº¯t LÆ°ng Da Saffiano Reversible Triangle Belt",
                Slug = "prada-prada-triangle-logo-belt",
                Sku = "PRA-BELT-3",
                CollectionName = "Prada Accessories",
                Description = "Tháº¯t LÆ°ng Da Saffiano Reversible Triangle Belt chÃ­nh hÃ£ng tá»« Prada. Cháº¿ tÃ¡c tá»« Da Saffiano dáº­p vÃ¢n chÃ©o chá»‘ng tráº§y, khÃ³a tam giÃ¡c báº¡c vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 15500000m,
                OriginalPrice = 17500000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/prada/prada-triangle-logo-belt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/prada/prada-triangle-logo-belt.jpg", "/img/brands/prada/prada-triangle-logo-belt.jpg", "/img/brands/prada/prada-triangle-logo-belt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da Saffiano dáº­p vÃ¢n chÃ©o chá»‘ng tráº§y, khÃ³a tam giÃ¡c báº¡c",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Prada, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_prada_prada_triangle_logo_belt.Variants.Add(new ProductVariant { Sku = "PRA-BELT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 15500000m, StockQuantity = 50 });
            allProducts.Add(prod_prada_prada_triangle_logo_belt);
            var prod_prada_prada_symbole_sunglasses = new Product
            {
                SellerId = seller_prada.Id,
                CategoryId = catAccessories.Id,
                Name = "KÃ­nh MÃ¡t Chá»¯ Nháº­t Prada Symbole Geometric",
                Slug = "prada-prada-symbole-sunglasses",
                Sku = "PRA-SUNG-3",
                CollectionName = "Prada Eyewear",
                Description = "KÃ­nh MÃ¡t Chá»¯ Nháº­t Prada Symbole Geometric chÃ­nh hÃ£ng tá»« Prada. Cháº¿ tÃ¡c tá»« Gá»ng Acetate cáº¯t gÃ³c geometric, trÃ²ng chá»‘ng lÃ³a 100% vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 12800000m,
                OriginalPrice = 14500000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/prada/prada-symbole-sunglasses.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/prada/prada-symbole-sunglasses.jpg", "/img/brands/prada/prada-symbole-sunglasses.jpg", "/img/brands/prada/prada-symbole-sunglasses.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Gá»ng Acetate cáº¯t gÃ³c geometric, trÃ²ng chá»‘ng lÃ³a 100%",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Prada, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_prada_prada_symbole_sunglasses.Variants.Add(new ProductVariant { Sku = "PRA-SUNG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 12800000m, StockQuantity = 50 });
            allProducts.Add(prod_prada_prada_symbole_sunglasses);
            var prod_prada_prada_saffiano_card_holder = new Product
            {
                SellerId = seller_prada.Id,
                CategoryId = catAccessories.Id,
                Name = "VÃ­ Äá»±ng Tháº» Saffiano Leather Card Holder",
                Slug = "prada-prada-saffiano-card-holder",
                Sku = "PRA-HOLD-3",
                CollectionName = "Prada Small Leather",
                Description = "VÃ­ Äá»±ng Tháº» Saffiano Leather Card Holder chÃ­nh hÃ£ng tá»« Prada. Cháº¿ tÃ¡c tá»« Da Saffiano Ä‘en 6 ngÄƒn cáº¯m tháº», logo men kim loáº¡i vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 9500000m,
                OriginalPrice = 11000000m,
                DiscountPercent = 14,
                ImageUrl = "/img/brands/prada/prada-saffiano-card-holder.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/prada/prada-saffiano-card-holder.jpg", "/img/brands/prada/prada-saffiano-card-holder.jpg", "/img/brands/prada/prada-saffiano-card-holder.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da Saffiano Ä‘en 6 ngÄƒn cáº¯m tháº», logo men kim loáº¡i",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Prada, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_prada_prada_saffiano_card_holder.Variants.Add(new ProductVariant { Sku = "PRA-HOLD-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 9500000m, StockQuantity = 50 });
            allProducts.Add(prod_prada_prada_saffiano_card_holder);

            var seller_balenciaga = dbUsers.First(u => u.Email == "balenciaga@gmail.com");
            var prod_balenciaga_balenciaga_le_city_medium_bag = new Product
            {
                SellerId = seller_balenciaga.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Le City Medium Arena Leather Bag",
                Slug = "balenciaga-balenciaga-le-city-medium-bag",
                Sku = "BAL-BAG-3",
                CollectionName = "Balenciaga Icons",
                Description = "TÃºi XÃ¡ch Le City Medium Arena Leather Bag chÃ­nh hÃ£ng tá»« Balenciaga. Cháº¿ tÃ¡c tá»« Da cá»«u non Arena nhÄƒn tá»± nhiÃªn, Ä‘inh tÃ¡n kim loáº¡i báº¡c vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 68000000m,
                OriginalPrice = 75000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/balenciaga/balenciaga-le-city-medium-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/balenciaga/balenciaga-le-city-medium-bag.jpg", "/img/brands/balenciaga/balenciaga-le-city-medium-bag.jpg", "/img/brands/balenciaga/balenciaga-le-city-medium-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da cá»«u non Arena nhÄƒn tá»± nhiÃªn, Ä‘inh tÃ¡n kim loáº¡i báº¡c",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Balenciaga, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha / PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_balenciaga_balenciaga_le_city_medium_bag.Variants.Add(new ProductVariant { Sku = "BAL-BAG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 68000000m, StockQuantity = 50 });
            allProducts.Add(prod_balenciaga_balenciaga_le_city_medium_bag);
            var prod_balenciaga_balenciaga_triple_s_sneaker = new Product
            {
                SellerId = seller_balenciaga.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Triple S Clear Sole White Multi",
                Slug = "balenciaga-balenciaga-triple-s-sneaker",
                Sku = "BAL-SNEA-1",
                CollectionName = "Balenciaga Triple S",
                Description = "GiÃ y Sneaker Triple S Clear Sole White Multi chÃ­nh hÃ£ng tá»« Balenciaga. Cháº¿ tÃ¡c tá»« Äáº¿ ba lá»›p cÃ´ng nghá»‡ Clear Sole bÃ¡n trong suá»‘t vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 26500000m,
                OriginalPrice = 29000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/balenciaga/balenciaga-triple-s-sneaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/balenciaga/balenciaga-triple-s-sneaker.jpg", "/img/brands/balenciaga/balenciaga-triple-s-sneaker.jpg", "/img/brands/balenciaga/balenciaga-triple-s-sneaker.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Äáº¿ ba lá»›p cÃ´ng nghá»‡ Clear Sole bÃ¡n trong suá»‘t",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Balenciaga, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha / PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_balenciaga_balenciaga_triple_s_sneaker.Variants.Add(new ProductVariant { Sku = "BAL-SNEA-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 26500000m, StockQuantity = 15 });
            prod_balenciaga_balenciaga_triple_s_sneaker.Variants.Add(new ProductVariant { Sku = "BAL-SNEA-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 26500000m, StockQuantity = 20 });
            prod_balenciaga_balenciaga_triple_s_sneaker.Variants.Add(new ProductVariant { Sku = "BAL-SNEA-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 26500000m, StockQuantity = 15 });
            allProducts.Add(prod_balenciaga_balenciaga_triple_s_sneaker);
            var prod_balenciaga_balenciaga_track_sneaker_noir = new Product
            {
                SellerId = seller_balenciaga.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Track 4.0 LED Light-Up Sneaker",
                Slug = "balenciaga-balenciaga-track-sneaker-noir",
                Sku = "BAL-NOIR-1",
                CollectionName = "Balenciaga Track",
                Description = "GiÃ y Sneaker Track 4.0 LED Light-Up Sneaker chÃ­nh hÃ£ng tá»« Balenciaga. Cháº¿ tÃ¡c tá»« PhiÃªn báº£n Ä‘Ã¨n LED gÃ³t 11 cháº¿ Ä‘á»™, dÃ¢y buá»™c Ä‘a lá»›p vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 32000000m,
                OriginalPrice = 36000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/balenciaga/balenciaga-track-sneaker-noir.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/balenciaga/balenciaga-track-sneaker-noir.jpg", "/img/brands/balenciaga/balenciaga-track-sneaker-noir.jpg", "/img/brands/balenciaga/balenciaga-track-sneaker-noir.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "PhiÃªn báº£n Ä‘Ã¨n LED gÃ³t 11 cháº¿ Ä‘á»™, dÃ¢y buá»™c Ä‘a lá»›p",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Balenciaga, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha / PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_balenciaga_balenciaga_track_sneaker_noir.Variants.Add(new ProductVariant { Sku = "BAL-NOIR-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 32000000m, StockQuantity = 15 });
            prod_balenciaga_balenciaga_track_sneaker_noir.Variants.Add(new ProductVariant { Sku = "BAL-NOIR-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 32000000m, StockQuantity = 20 });
            prod_balenciaga_balenciaga_track_sneaker_noir.Variants.Add(new ProductVariant { Sku = "BAL-NOIR-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 32000000m, StockQuantity = 15 });
            allProducts.Add(prod_balenciaga_balenciaga_track_sneaker_noir);
            var prod_balenciaga_balenciaga_oversized_denim_jacket = new Product
            {
                SellerId = seller_balenciaga.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c BÃ² Oversized Ripped Denim Jacket",
                Slug = "balenciaga-balenciaga-oversized-denim-jacket",
                Sku = "BAL-JACK-2",
                CollectionName = "Balenciaga Streetwear",
                Description = "Ão KhoÃ¡c BÃ² Oversized Ripped Denim Jacket chÃ­nh hÃ£ng tá»« Balenciaga. Cháº¿ tÃ¡c tá»« Váº£i Denim Nháº­t Báº£n wash mÃ i rÃ¡ch thá»§ cÃ´ng phong cÃ¡ch grunge vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 42000000m,
                OriginalPrice = 48000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/balenciaga/balenciaga-oversized-denim-jacket.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/balenciaga/balenciaga-oversized-denim-jacket.jpg", "/img/brands/balenciaga/balenciaga-oversized-denim-jacket.jpg", "/img/brands/balenciaga/balenciaga-oversized-denim-jacket.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i Denim Nháº­t Báº£n wash mÃ i rÃ¡ch thá»§ cÃ´ng phong cÃ¡ch grunge",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Balenciaga, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha / PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_balenciaga_balenciaga_oversized_denim_jacket.Variants.Add(new ProductVariant { Sku = "BAL-JACK-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 42000000m, StockQuantity = 15 });
            prod_balenciaga_balenciaga_oversized_denim_jacket.Variants.Add(new ProductVariant { Sku = "BAL-JACK-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 42000000m, StockQuantity = 20 });
            prod_balenciaga_balenciaga_oversized_denim_jacket.Variants.Add(new ProductVariant { Sku = "BAL-JACK-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 42000000m, StockQuantity = 15 });
            allProducts.Add(prod_balenciaga_balenciaga_oversized_denim_jacket);
            var prod_balenciaga_balenciaga_strike_combat_boots = new Product
            {
                SellerId = seller_balenciaga.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Bá»‘t Strike 20mm Matte Leather Combat Boots",
                Slug = "balenciaga-balenciaga-strike-combat-boots",
                Sku = "BAL-BOOT-1",
                CollectionName = "Balenciaga Strike",
                Description = "GiÃ y Bá»‘t Strike 20mm Matte Leather Combat Boots chÃ­nh hÃ£ng tá»« Balenciaga. Cháº¿ tÃ¡c tá»« Da bÃ² Ä‘en má», Ä‘áº¿ cao su khÃ¢u viá»n rÄƒng cÆ°a cháº¯c cháº¯n vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 31000000m,
                OriginalPrice = 35000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/balenciaga/balenciaga-strike-combat-boots.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/balenciaga/balenciaga-strike-combat-boots.jpg", "/img/brands/balenciaga/balenciaga-strike-combat-boots.jpg", "/img/brands/balenciaga/balenciaga-strike-combat-boots.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² Ä‘en má», Ä‘áº¿ cao su khÃ¢u viá»n rÄƒng cÆ°a cháº¯c cháº¯n",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Balenciaga, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha / PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_balenciaga_balenciaga_strike_combat_boots.Variants.Add(new ProductVariant { Sku = "BAL-BOOT-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 31000000m, StockQuantity = 15 });
            prod_balenciaga_balenciaga_strike_combat_boots.Variants.Add(new ProductVariant { Sku = "BAL-BOOT-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 31000000m, StockQuantity = 20 });
            prod_balenciaga_balenciaga_strike_combat_boots.Variants.Add(new ProductVariant { Sku = "BAL-BOOT-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 31000000m, StockQuantity = 15 });
            allProducts.Add(prod_balenciaga_balenciaga_strike_combat_boots);
            var prod_balenciaga_balenciaga_hourglass_xs_bag = new Product
            {
                SellerId = seller_balenciaga.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Hourglass XS Top Handle Shiny Calfskin",
                Slug = "balenciaga-balenciaga-hourglass-xs-bag",
                Sku = "BAL-BAG-4",
                CollectionName = "Balenciaga Hourglass",
                Description = "TÃºi XÃ¡ch Hourglass XS Top Handle Shiny Calfskin chÃ­nh hÃ£ng tá»« Balenciaga. Cháº¿ tÃ¡c tá»« Thiáº¿t káº¿ Ä‘Ã¡y uá»‘n cong parabol Ä‘á»™c Ä‘Ã¡o, khÃ³a chá»¯ B máº¡ vÃ ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 58000000m,
                OriginalPrice = 65000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/balenciaga/balenciaga-hourglass-xs-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/balenciaga/balenciaga-hourglass-xs-bag.jpg", "/img/brands/balenciaga/balenciaga-hourglass-xs-bag.jpg", "/img/brands/balenciaga/balenciaga-hourglass-xs-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Thiáº¿t káº¿ Ä‘Ã¡y uá»‘n cong parabol Ä‘á»™c Ä‘Ã¡o, khÃ³a chá»¯ B máº¡ vÃ ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Balenciaga, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha / PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_balenciaga_balenciaga_hourglass_xs_bag.Variants.Add(new ProductVariant { Sku = "BAL-BAG-4-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 58000000m, StockQuantity = 50 });
            allProducts.Add(prod_balenciaga_balenciaga_hourglass_xs_bag);
            var prod_balenciaga_balenciaga_bb_monogram_belt = new Product
            {
                SellerId = seller_balenciaga.Id,
                CategoryId = catAccessories.Id,
                Name = "Tháº¯t LÆ°ng Da BB Monogram Antique Brass Belt",
                Slug = "balenciaga-balenciaga-bb-monogram-belt",
                Sku = "BAL-BELT-3",
                CollectionName = "Balenciaga Belts",
                Description = "Tháº¯t LÆ°ng Da BB Monogram Antique Brass Belt chÃ­nh hÃ£ng tá»« Balenciaga. Cháº¿ tÃ¡c tá»« Da bÃ² trÆ¡n thuá»™c tháº£o má»™c, máº·t khÃ³a BB Ä‘á»“ng giáº£ cá»• vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 12500000m,
                OriginalPrice = 14000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/balenciaga/balenciaga-bb-monogram-belt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/balenciaga/balenciaga-bb-monogram-belt.jpg", "/img/brands/balenciaga/balenciaga-bb-monogram-belt.jpg", "/img/brands/balenciaga/balenciaga-bb-monogram-belt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² trÆ¡n thuá»™c tháº£o má»™c, máº·t khÃ³a BB Ä‘á»“ng giáº£ cá»•",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Balenciaga, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha / PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_balenciaga_balenciaga_bb_monogram_belt.Variants.Add(new ProductVariant { Sku = "BAL-BELT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 12500000m, StockQuantity = 50 });
            allProducts.Add(prod_balenciaga_balenciaga_bb_monogram_belt);
            var prod_balenciaga_balenciaga_dynasty_sunglasses = new Product
            {
                SellerId = seller_balenciaga.Id,
                CategoryId = catAccessories.Id,
                Name = "KÃ­nh MÃ¡t Chá»¯ Nháº­t Dynasty Rectangle Sunglasses",
                Slug = "balenciaga-balenciaga-dynasty-sunglasses",
                Sku = "BAL-SUNG-3",
                CollectionName = "Balenciaga Eyewear",
                Description = "KÃ­nh MÃ¡t Chá»¯ Nháº­t Dynasty Rectangle Sunglasses chÃ­nh hÃ£ng tá»« Balenciaga. Cháº¿ tÃ¡c tá»« Gá»ng dÃ y Ä‘Ã­nh logo BB kim loáº¡i máº¡ vÃ ng hai bÃªn cÃ ng kÃ­nh vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 13500000m,
                OriginalPrice = 15000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/balenciaga/balenciaga-dynasty-sunglasses.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/balenciaga/balenciaga-dynasty-sunglasses.jpg", "/img/brands/balenciaga/balenciaga-dynasty-sunglasses.jpg", "/img/brands/balenciaga/balenciaga-dynasty-sunglasses.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Gá»ng dÃ y Ä‘Ã­nh logo BB kim loáº¡i máº¡ vÃ ng hai bÃªn cÃ ng kÃ­nh",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Balenciaga, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha / PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_balenciaga_balenciaga_dynasty_sunglasses.Variants.Add(new ProductVariant { Sku = "BAL-SUNG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 13500000m, StockQuantity = 50 });
            allProducts.Add(prod_balenciaga_balenciaga_dynasty_sunglasses);

            var seller_hermes = dbUsers.First(u => u.Email == "hermes@gmail.com");
            var prod_hermes_hermes_birkin_30_togo_gold = new Product
            {
                SellerId = seller_hermes.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Birkin 30 Togo Leather Gold Hardware",
                Slug = "hermes-hermes-birkin-30-togo-gold",
                Sku = "HER-GOLD-3",
                CollectionName = "HermÃ¨s Birkin Heritage",
                Description = "TÃºi XÃ¡ch Birkin 30 Togo Leather Gold Hardware chÃ­nh hÃ£ng tá»« HermÃ¨s. Cháº¿ tÃ¡c tá»« Da bÃª Togo sáº§n chá»‘ng xÆ°á»›c, khÃ³a kim loáº¡i máº¡ vÃ ng 18K vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 380000000m,
                OriginalPrice = 420000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/hermes/hermes-birkin-30-togo-gold.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/hermes/hermes-birkin-30-togo-gold.jpg", "/img/brands/hermes/hermes-birkin-30-togo-gold.jpg", "/img/brands/hermes/hermes-birkin-30-togo-gold.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª Togo sáº§n chá»‘ng xÆ°á»›c, khÃ³a kim loáº¡i máº¡ vÃ ng 18K",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a HermÃ¨s, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_hermes_hermes_birkin_30_togo_gold.Variants.Add(new ProductVariant { Sku = "HER-GOLD-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 380000000m, StockQuantity = 50 });
            allProducts.Add(prod_hermes_hermes_birkin_30_togo_gold);
            var prod_hermes_hermes_kelly_28_epsom_leather = new Product
            {
                SellerId = seller_hermes.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Kelly 28 Sellier Epsom Leather",
                Slug = "hermes-hermes-kelly-28-epsom-leather",
                Sku = "HER-LEAT-3",
                CollectionName = "HermÃ¨s Kelly Sellier",
                Description = "TÃºi XÃ¡ch Kelly 28 Sellier Epsom Leather chÃ­nh hÃ£ng tá»« HermÃ¨s. Cháº¿ tÃ¡c tá»« Da Epsom cá»©ng cÃ¡p giá»¯ form tuyá»‡t Ä‘á»‘i, Ä‘Æ°á»ng may viá»n Sellier vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 340000000m,
                OriginalPrice = 370000000m,
                DiscountPercent = 8,
                ImageUrl = "/img/brands/hermes/hermes-kelly-28-epsom-leather.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/hermes/hermes-kelly-28-epsom-leather.jpg", "/img/brands/hermes/hermes-kelly-28-epsom-leather.jpg", "/img/brands/hermes/hermes-kelly-28-epsom-leather.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da Epsom cá»©ng cÃ¡p giá»¯ form tuyá»‡t Ä‘á»‘i, Ä‘Æ°á»ng may viá»n Sellier",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a HermÃ¨s, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_hermes_hermes_kelly_28_epsom_leather.Variants.Add(new ProductVariant { Sku = "HER-LEAT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 340000000m, StockQuantity = 50 });
            allProducts.Add(prod_hermes_hermes_kelly_28_epsom_leather);
            var prod_hermes_hermes_oran_flat_sandals = new Product
            {
                SellerId = seller_hermes.Id,
                CategoryId = catSneaker.Id,
                Name = "DÃ©p Quai Ngang Oran Flat Calfskin Sandals Gold",
                Slug = "hermes-hermes-oran-flat-sandals",
                Sku = "HER-SAND-1",
                CollectionName = "HermÃ¨s Footwear",
                Description = "DÃ©p Quai Ngang Oran Flat Calfskin Sandals Gold chÃ­nh hÃ£ng tá»« HermÃ¨s. Cháº¿ tÃ¡c tá»« Da bÃª Box cao cáº¥p mÃ u nÃ¢u bÃ² Gold, quai chá»¯ H kinh Ä‘iá»ƒn vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 19500000m,
                OriginalPrice = 22000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/hermes/hermes-oran-flat-sandals.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/hermes/hermes-oran-flat-sandals.jpg", "/img/brands/hermes/hermes-oran-flat-sandals.jpg", "/img/brands/hermes/hermes-oran-flat-sandals.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª Box cao cáº¥p mÃ u nÃ¢u bÃ² Gold, quai chá»¯ H kinh Ä‘iá»ƒn",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a HermÃ¨s, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_hermes_hermes_oran_flat_sandals.Variants.Add(new ProductVariant { Sku = "HER-SAND-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 19500000m, StockQuantity = 15 });
            prod_hermes_hermes_oran_flat_sandals.Variants.Add(new ProductVariant { Sku = "HER-SAND-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 19500000m, StockQuantity = 20 });
            prod_hermes_hermes_oran_flat_sandals.Variants.Add(new ProductVariant { Sku = "HER-SAND-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 19500000m, StockQuantity = 15 });
            allProducts.Add(prod_hermes_hermes_oran_flat_sandals);
            var prod_hermes_hermes_constance_h_belt = new Product
            {
                SellerId = seller_hermes.Id,
                CategoryId = catAccessories.Id,
                Name = "Tháº¯t LÆ°ng Da Constance H-Buckle Reversible",
                Slug = "hermes-hermes-constance-h-belt",
                Sku = "HER-BELT-3",
                CollectionName = "HermÃ¨s Belts",
                Description = "Tháº¯t LÆ°ng Da Constance H-Buckle Reversible chÃ­nh hÃ£ng tá»« HermÃ¨s. Cháº¿ tÃ¡c tá»« Da Togo/Swift hai máº·t, máº·t khÃ³a chá»¯ H máº¡ palladium sÃ¡ng bÃ³ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 24500000m,
                OriginalPrice = 27500000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/hermes/hermes-constance-h-belt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/hermes/hermes-constance-h-belt.jpg", "/img/brands/hermes/hermes-constance-h-belt.jpg", "/img/brands/hermes/hermes-constance-h-belt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da Togo/Swift hai máº·t, máº·t khÃ³a chá»¯ H máº¡ palladium sÃ¡ng bÃ³ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a HermÃ¨s, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_hermes_hermes_constance_h_belt.Variants.Add(new ProductVariant { Sku = "HER-BELT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 24500000m, StockQuantity = 50 });
            allProducts.Add(prod_hermes_hermes_constance_h_belt);
            var prod_hermes_hermes_silk_carre_scarf = new Product
            {
                SellerId = seller_hermes.Id,
                CategoryId = catAccessories.Id,
                Name = "KhÄƒn Lá»¥a TÆ¡ Táº±m CarrÃ© 90x90 Grand Tralala",
                Slug = "hermes-hermes-silk-carre-scarf",
                Sku = "HER-SCAR-3",
                CollectionName = "HermÃ¨s Silk",
                Description = "KhÄƒn Lá»¥a TÆ¡ Táº±m CarrÃ© 90x90 Grand Tralala chÃ­nh hÃ£ng tá»« HermÃ¨s. Cháº¿ tÃ¡c tá»« Lá»¥a tÆ¡ táº±m dá»‡t thá»§ cÃ´ng táº¡i Lyon, viá»n may tay cuá»™n trÃ²n vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 13500000m,
                OriginalPrice = 15500000m,
                DiscountPercent = 13,
                ImageUrl = "/img/brands/hermes/hermes-silk-carre-scarf.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/hermes/hermes-silk-carre-scarf.jpg", "/img/brands/hermes/hermes-silk-carre-scarf.jpg", "/img/brands/hermes/hermes-silk-carre-scarf.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Lá»¥a tÆ¡ táº±m dá»‡t thá»§ cÃ´ng táº¡i Lyon, viá»n may tay cuá»™n trÃ²n",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a HermÃ¨s, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_hermes_hermes_silk_carre_scarf.Variants.Add(new ProductVariant { Sku = "HER-SCAR-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 13500000m, StockQuantity = 50 });
            allProducts.Add(prod_hermes_hermes_silk_carre_scarf);
            var prod_hermes_hermes_calvi_card_case = new Product
            {
                SellerId = seller_hermes.Id,
                CategoryId = catAccessories.Id,
                Name = "VÃ­ Äá»±ng Tháº» Calvi Card Case Epsom Leather",
                Slug = "hermes-hermes-calvi-card-case",
                Sku = "HER-CASE-3",
                CollectionName = "HermÃ¨s Small Leather",
                Description = "VÃ­ Äá»±ng Tháº» Calvi Card Case Epsom Leather chÃ­nh hÃ£ng tá»« HermÃ¨s. Cháº¿ tÃ¡c tá»« Thiáº¿t káº¿ gáº­p phong bÃ¬ tá»‘i giáº£n da Epsom bá»n bá»‰ vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 12000000m,
                OriginalPrice = 14000000m,
                DiscountPercent = 14,
                ImageUrl = "/img/brands/hermes/hermes-calvi-card-case.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/hermes/hermes-calvi-card-case.jpg", "/img/brands/hermes/hermes-calvi-card-case.jpg", "/img/brands/hermes/hermes-calvi-card-case.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Thiáº¿t káº¿ gáº­p phong bÃ¬ tá»‘i giáº£n da Epsom bá»n bá»‰",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a HermÃ¨s, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_hermes_hermes_calvi_card_case.Variants.Add(new ProductVariant { Sku = "HER-CASE-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 12000000m, StockQuantity = 50 });
            allProducts.Add(prod_hermes_hermes_calvi_card_case);
            var prod_hermes_hermes_chaine_dancre_bracelet = new Product
            {
                SellerId = seller_hermes.Id,
                CategoryId = catAccessories.Id,
                Name = "VÃ²ng Tay Báº¡c Chaine d'Ancre Silver Bracelet",
                Slug = "hermes-hermes-chaine-dancre-bracelet",
                Sku = "HER-BRAC-3",
                CollectionName = "HermÃ¨s Bijouterie",
                Description = "VÃ²ng Tay Báº¡c Chaine d'Ancre Silver Bracelet chÃ­nh hÃ£ng tá»« HermÃ¨s. Cháº¿ tÃ¡c tá»« Báº¡c nguyÃªn khá»‘i 925 láº¥y cáº£m há»©ng tá»« má» neo du thuyá»n vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 42000000m,
                OriginalPrice = 47000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/hermes/hermes-chaine-dancre-bracelet.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/hermes/hermes-chaine-dancre-bracelet.jpg", "/img/brands/hermes/hermes-chaine-dancre-bracelet.jpg", "/img/brands/hermes/hermes-chaine-dancre-bracelet.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Báº¡c nguyÃªn khá»‘i 925 láº¥y cáº£m há»©ng tá»« má» neo du thuyá»n",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a HermÃ¨s, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_hermes_hermes_chaine_dancre_bracelet.Variants.Add(new ProductVariant { Sku = "HER-BRAC-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 42000000m, StockQuantity = 50 });
            allProducts.Add(prod_hermes_hermes_chaine_dancre_bracelet);
            var prod_hermes_hermes_terre_d_hermes_parfum = new Product
            {
                SellerId = seller_hermes.Id,
                CategoryId = catAccessories.Id,
                Name = "NÆ°á»›c Hoa Terre d'HermÃ¨s Eau Intense VÃ©tiver 100ml",
                Slug = "hermes-hermes-terre-d-hermes-parfum",
                Sku = "HER-PARF-3",
                CollectionName = "HermÃ¨s Parfums",
                Description = "NÆ°á»›c Hoa Terre d'HermÃ¨s Eau Intense VÃ©tiver 100ml chÃ­nh hÃ£ng tá»« HermÃ¨s. Cháº¿ tÃ¡c tá»« HÆ°Æ¡ng gá»— khoÃ¡ng Ä‘áº¡t, cá» hÆ°Æ¡ng bÃ i vÃ  cam Bergamot ná»“ng nÃ n vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 3850000m,
                OriginalPrice = 4300000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/hermes/hermes-terre-d-hermes-parfum.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/hermes/hermes-terre-d-hermes-parfum.jpg", "/img/brands/hermes/hermes-terre-d-hermes-parfum.jpg", "/img/brands/hermes/hermes-terre-d-hermes-parfum.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "HÆ°Æ¡ng gá»— khoÃ¡ng Ä‘áº¡t, cá» hÆ°Æ¡ng bÃ i vÃ  cam Bergamot ná»“ng nÃ n",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a HermÃ¨s, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_hermes_hermes_terre_d_hermes_parfum.Variants.Add(new ProductVariant { Sku = "HER-PARF-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 3850000m, StockQuantity = 50 });
            allProducts.Add(prod_hermes_hermes_terre_d_hermes_parfum);

            var seller_versace = dbUsers.First(u => u.Email == "versace@gmail.com");
            var prod_versace_versace_la_medusa_handbag = new Product
            {
                SellerId = seller_versace.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch La Medusa Small Leather Handbag",
                Slug = "versace-versace-la-medusa-handbag",
                Sku = "VER-HAND-3",
                CollectionName = "Versace La Medusa",
                Description = "TÃºi XÃ¡ch La Medusa Small Leather Handbag chÃ­nh hÃ£ng tá»« Versace. Cháº¿ tÃ¡c tá»« Da bÃª dáº»o má»m má»‹n, logo Ä‘áº§u ná»¯ tháº§n ráº¯n Medusa máº¡ vÃ ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 48000000m,
                OriginalPrice = 54000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/versace/versace-la-medusa-handbag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/versace/versace-la-medusa-handbag.jpg", "/img/brands/versace/versace-la-medusa-handbag.jpg", "/img/brands/versace/versace-la-medusa-handbag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª dáº»o má»m má»‹n, logo Ä‘áº§u ná»¯ tháº§n ráº¯n Medusa máº¡ vÃ ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Versace, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_versace_versace_la_medusa_handbag.Variants.Add(new ProductVariant { Sku = "VER-HAND-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 48000000m, StockQuantity = 50 });
            allProducts.Add(prod_versace_versace_la_medusa_handbag);
            var prod_versace_versace_barocco_silk_shirt = new Product
            {
                SellerId = seller_versace.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão SÆ¡ Mi Lá»¥a Barocco Silk Button-Up Shirt",
                Slug = "versace-versace-barocco-silk-shirt",
                Sku = "VER-SHIR-2",
                CollectionName = "Versace Silk Icons",
                Description = "Ão SÆ¡ Mi Lá»¥a Barocco Silk Button-Up Shirt chÃ­nh hÃ£ng tá»« Versace. Cháº¿ tÃ¡c tá»« 100% Lá»¥a tÆ¡ táº±m in há»a tiáº¿t hoa vÄƒn vÃ ng hoÃ ng gia Baroque vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 38000000m,
                OriginalPrice = 43000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/versace/versace-barocco-silk-shirt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/versace/versace-barocco-silk-shirt.jpg", "/img/brands/versace/versace-barocco-silk-shirt.jpg", "/img/brands/versace/versace-barocco-silk-shirt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "100% Lá»¥a tÆ¡ táº±m in há»a tiáº¿t hoa vÄƒn vÃ ng hoÃ ng gia Baroque",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Versace, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_versace_versace_barocco_silk_shirt.Variants.Add(new ProductVariant { Sku = "VER-SHIR-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 38000000m, StockQuantity = 15 });
            prod_versace_versace_barocco_silk_shirt.Variants.Add(new ProductVariant { Sku = "VER-SHIR-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 38000000m, StockQuantity = 20 });
            prod_versace_versace_barocco_silk_shirt.Variants.Add(new ProductVariant { Sku = "VER-SHIR-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 38000000m, StockQuantity = 15 });
            allProducts.Add(prod_versace_versace_barocco_silk_shirt);
            var prod_versace_versace_chain_reaction_sneaker = new Product
            {
                SellerId = seller_versace.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Chain Reaction Chunky Sole",
                Slug = "versace-versace-chain-reaction-sneaker",
                Sku = "VER-SNEA-1",
                CollectionName = "Versace Footwear",
                Description = "GiÃ y Sneaker Chain Reaction Chunky Sole chÃ­nh hÃ£ng tá»« Versace. Cháº¿ tÃ¡c tá»« Äáº¿ Ä‘Ãºc hÃ¬nh máº¯t xÃ­ch dÃ¢y chuyá»n Versace, há»a tiáº¿t da bÃ¡o vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 24500000m,
                OriginalPrice = 27500000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/versace/versace-chain-reaction-sneaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/versace/versace-chain-reaction-sneaker.jpg", "/img/brands/versace/versace-chain-reaction-sneaker.jpg", "/img/brands/versace/versace-chain-reaction-sneaker.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Äáº¿ Ä‘Ãºc hÃ¬nh máº¯t xÃ­ch dÃ¢y chuyá»n Versace, há»a tiáº¿t da bÃ¡o",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Versace, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_versace_versace_chain_reaction_sneaker.Variants.Add(new ProductVariant { Sku = "VER-SNEA-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 24500000m, StockQuantity = 15 });
            prod_versace_versace_chain_reaction_sneaker.Variants.Add(new ProductVariant { Sku = "VER-SNEA-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 24500000m, StockQuantity = 20 });
            prod_versace_versace_chain_reaction_sneaker.Variants.Add(new ProductVariant { Sku = "VER-SNEA-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 24500000m, StockQuantity = 15 });
            allProducts.Add(prod_versace_versace_chain_reaction_sneaker);
            var prod_versace_versace_medusa_biggie_sunglasses = new Product
            {
                SellerId = seller_versace.Id,
                CategoryId = catAccessories.Id,
                Name = "KÃ­nh MÃ¡t Medusa Biggie Geometric Sunglasses",
                Slug = "versace-versace-medusa-biggie-sunglasses",
                Sku = "VER-SUNG-3",
                CollectionName = "Versace Eyewear",
                Description = "KÃ­nh MÃ¡t Medusa Biggie Geometric Sunglasses chÃ­nh hÃ£ng tá»« Versace. Cháº¿ tÃ¡c tá»« Gá»ng acetate láº¥y cáº£m há»©ng tá»« rapper Biggie Smalls tháº­p niÃªn 90 vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 9500000m,
                OriginalPrice = 11000000m,
                DiscountPercent = 14,
                ImageUrl = "/img/brands/versace/versace-medusa-biggie-sunglasses.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/versace/versace-medusa-biggie-sunglasses.jpg", "/img/brands/versace/versace-medusa-biggie-sunglasses.jpg", "/img/brands/versace/versace-medusa-biggie-sunglasses.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Gá»ng acetate láº¥y cáº£m há»©ng tá»« rapper Biggie Smalls tháº­p niÃªn 90",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Versace, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_versace_versace_medusa_biggie_sunglasses.Variants.Add(new ProductVariant { Sku = "VER-SUNG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 9500000m, StockQuantity = 50 });
            allProducts.Add(prod_versace_versace_medusa_biggie_sunglasses);
            var prod_versace_versace_palazzo_leather_belt = new Product
            {
                SellerId = seller_versace.Id,
                CategoryId = catAccessories.Id,
                Name = "Tháº¯t LÆ°ng Da Palazzo Medusa Buckle Belt",
                Slug = "versace-versace-palazzo-leather-belt",
                Sku = "VER-BELT-3",
                CollectionName = "Versace Belts",
                Description = "Tháº¯t LÆ°ng Da Palazzo Medusa Buckle Belt chÃ­nh hÃ£ng tá»« Versace. Cháº¿ tÃ¡c tá»« Da bÃ² nappa dáº­p vÃ¢n nháº¹, máº·t khÃ³a Ä‘áº§u ráº¯n Medusa 3D ná»•i báº­t vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 14000000m,
                OriginalPrice = 16000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/versace/versace-palazzo-leather-belt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/versace/versace-palazzo-leather-belt.jpg", "/img/brands/versace/versace-palazzo-leather-belt.jpg", "/img/brands/versace/versace-palazzo-leather-belt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² nappa dáº­p vÃ¢n nháº¹, máº·t khÃ³a Ä‘áº§u ráº¯n Medusa 3D ná»•i báº­t",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Versace, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_versace_versace_palazzo_leather_belt.Variants.Add(new ProductVariant { Sku = "VER-BELT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 14000000m, StockQuantity = 50 });
            allProducts.Add(prod_versace_versace_palazzo_leather_belt);
            var prod_versace_versace_baroque_bathrobe = new Product
            {
                SellerId = seller_versace.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão ChoÃ ng Táº¯m Cotton Barocco Bathrobe",
                Slug = "versace-versace-baroque-bathrobe",
                Sku = "VER-BATH-2",
                CollectionName = "Versace Maison",
                Description = "Ão ChoÃ ng Táº¯m Cotton Barocco Bathrobe chÃ­nh hÃ£ng tá»« Versace. Cháº¿ tÃ¡c tá»« 100% Cotton Jacquard dá»‡t há»a tiáº¿t Greca vÃ  hoa vÄƒn Baroque vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 16500000m,
                OriginalPrice = 18500000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/versace/versace-baroque-bathrobe.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/versace/versace-baroque-bathrobe.jpg", "/img/brands/versace/versace-baroque-bathrobe.jpg", "/img/brands/versace/versace-baroque-bathrobe.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "100% Cotton Jacquard dá»‡t há»a tiáº¿t Greca vÃ  hoa vÄƒn Baroque",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Versace, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_versace_versace_baroque_bathrobe.Variants.Add(new ProductVariant { Sku = "VER-BATH-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 16500000m, StockQuantity = 15 });
            prod_versace_versace_baroque_bathrobe.Variants.Add(new ProductVariant { Sku = "VER-BATH-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 16500000m, StockQuantity = 20 });
            prod_versace_versace_baroque_bathrobe.Variants.Add(new ProductVariant { Sku = "VER-BATH-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 16500000m, StockQuantity = 15 });
            allProducts.Add(prod_versace_versace_baroque_bathrobe);
            var prod_versace_versace_dylan_blue_parfum = new Product
            {
                SellerId = seller_versace.Id,
                CategoryId = catAccessories.Id,
                Name = "NÆ°á»›c Hoa Dylan Blue Pour Homme Eau de Toilette 100ml",
                Slug = "versace-versace-dylan-blue-parfum",
                Sku = "VER-PARF-3",
                CollectionName = "Versace Fragrance",
                Description = "NÆ°á»›c Hoa Dylan Blue Pour Homme Eau de Toilette 100ml chÃ­nh hÃ£ng tá»« Versace. Cháº¿ tÃ¡c tá»« HÆ°Æ¡ng cam chanh Äá»‹a Trung Háº£i, lÃ¡ sung vÃ  há»• phÃ¡ch xáº¡ hÆ°Æ¡ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2950000m,
                OriginalPrice = 3400000m,
                DiscountPercent = 13,
                ImageUrl = "/img/brands/versace/versace-dylan-blue-parfum.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/versace/versace-dylan-blue-parfum.jpg", "/img/brands/versace/versace-dylan-blue-parfum.jpg", "/img/brands/versace/versace-dylan-blue-parfum.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "HÆ°Æ¡ng cam chanh Äá»‹a Trung Háº£i, lÃ¡ sung vÃ  há»• phÃ¡ch xáº¡ hÆ°Æ¡ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Versace, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_versace_versace_dylan_blue_parfum.Variants.Add(new ProductVariant { Sku = "VER-PARF-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 2950000m, StockQuantity = 50 });
            allProducts.Add(prod_versace_versace_dylan_blue_parfum);
            var prod_versace_versace_greca_track_pants = new Product
            {
                SellerId = seller_versace.Id,
                CategoryId = catStreetwear.Id,
                Name = "Quáº§n Thá»ƒ Thao Greca Border Cotton Track Pants",
                Slug = "versace-versace-greca-track-pants",
                Sku = "VER-PANT-2",
                CollectionName = "Versace Activewear",
                Description = "Quáº§n Thá»ƒ Thao Greca Border Cotton Track Pants chÃ­nh hÃ£ng tá»« Versace. Cháº¿ tÃ¡c tá»« Cháº¥t ná»‰ cotton co giÃ£n nháº¹, Ä‘ai lÆ°ng dá»‡t hoa vÄƒn Greca Hy Láº¡p vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 18500000m,
                OriginalPrice = 21000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/versace/versace-greca-track-pants.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/versace/versace-greca-track-pants.jpg", "/img/brands/versace/versace-greca-track-pants.jpg", "/img/brands/versace/versace-greca-track-pants.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Cháº¥t ná»‰ cotton co giÃ£n nháº¹, Ä‘ai lÆ°ng dá»‡t hoa vÄƒn Greca Hy Láº¡p",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Versace, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_versace_versace_greca_track_pants.Variants.Add(new ProductVariant { Sku = "VER-PANT-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 18500000m, StockQuantity = 15 });
            prod_versace_versace_greca_track_pants.Variants.Add(new ProductVariant { Sku = "VER-PANT-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 18500000m, StockQuantity = 20 });
            prod_versace_versace_greca_track_pants.Variants.Add(new ProductVariant { Sku = "VER-PANT-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 18500000m, StockQuantity = 15 });
            allProducts.Add(prod_versace_versace_greca_track_pants);

            var seller_burberry = dbUsers.First(u => u.Email == "burberry@gmail.com");
            var prod_burberry_burberry_kensington_trench_coat = new Product
            {
                SellerId = seller_burberry.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão MÄƒng TÃ´ The Kensington Heritage Trench Coat",
                Slug = "burberry-burberry-kensington-trench-coat",
                Sku = "BUR-COAT-2",
                CollectionName = "Burberry Heritage Trench",
                Description = "Ão MÄƒng TÃ´ The Kensington Heritage Trench Coat chÃ­nh hÃ£ng tá»« Burberry. Cháº¿ tÃ¡c tá»« Váº£i dá»‡t Gabardine chá»‘ng tháº¥m nÆ°á»›c Ä‘á»™c quyá»n Thomas Burberry vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 68000000m,
                OriginalPrice = 76000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/burberry/burberry-kensington-trench-coat.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/burberry/burberry-kensington-trench-coat.jpg", "/img/brands/burberry/burberry-kensington-trench-coat.jpg", "/img/brands/burberry/burberry-kensington-trench-coat.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i dá»‡t Gabardine chá»‘ng tháº¥m nÆ°á»›c Ä‘á»™c quyá»n Thomas Burberry",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Burberry, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Anh Quá»‘c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_burberry_burberry_kensington_trench_coat.Variants.Add(new ProductVariant { Sku = "BUR-COAT-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 68000000m, StockQuantity = 15 });
            prod_burberry_burberry_kensington_trench_coat.Variants.Add(new ProductVariant { Sku = "BUR-COAT-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 68000000m, StockQuantity = 20 });
            prod_burberry_burberry_kensington_trench_coat.Variants.Add(new ProductVariant { Sku = "BUR-COAT-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 68000000m, StockQuantity = 15 });
            allProducts.Add(prod_burberry_burberry_kensington_trench_coat);
            var prod_burberry_burberry_vintage_check_scarf = new Product
            {
                SellerId = seller_burberry.Id,
                CategoryId = catAccessories.Id,
                Name = "KhÄƒn ChoÃ ng Cá»• Vintage Check Cashmere Scarf",
                Slug = "burberry-burberry-vintage-check-scarf",
                Sku = "BUR-SCAR-3",
                CollectionName = "Burberry Cashmere",
                Description = "KhÄƒn ChoÃ ng Cá»• Vintage Check Cashmere Scarf chÃ­nh hÃ£ng tá»« Burberry. Cháº¿ tÃ¡c tá»« 100% LÃ´ng dÃª Cashmere cháº£i báº±ng quáº£ káº¿ dáº¡i Scotland vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 15500000m,
                OriginalPrice = 17500000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/burberry/burberry-vintage-check-scarf.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/burberry/burberry-vintage-check-scarf.jpg", "/img/brands/burberry/burberry-vintage-check-scarf.jpg", "/img/brands/burberry/burberry-vintage-check-scarf.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "100% LÃ´ng dÃª Cashmere cháº£i báº±ng quáº£ káº¿ dáº¡i Scotland",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Burberry, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Anh Quá»‘c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_burberry_burberry_vintage_check_scarf.Variants.Add(new ProductVariant { Sku = "BUR-SCAR-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 15500000m, StockQuantity = 50 });
            allProducts.Add(prod_burberry_burberry_vintage_check_scarf);
            var prod_burberry_burberry_lola_quilted_bag = new Product
            {
                SellerId = seller_burberry.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Lola Quilted Leather Shoulder Bag",
                Slug = "burberry-burberry-lola-quilted-bag",
                Sku = "BUR-BAG-3",
                CollectionName = "Burberry Lola",
                Description = "TÃºi XÃ¡ch Lola Quilted Leather Shoulder Bag chÃ­nh hÃ£ng tá»« Burberry. Cháº¿ tÃ¡c tá»« Da cá»«u Ã cháº§n bÃ´ng quáº£ trÃ¡m, khÃ³a logo TB máº¡ vÃ ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 49000000m,
                OriginalPrice = 55000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/burberry/burberry-lola-quilted-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/burberry/burberry-lola-quilted-bag.jpg", "/img/brands/burberry/burberry-lola-quilted-bag.jpg", "/img/brands/burberry/burberry-lola-quilted-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da cá»«u Ã cháº§n bÃ´ng quáº£ trÃ¡m, khÃ³a logo TB máº¡ vÃ ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Burberry, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Anh Quá»‘c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_burberry_burberry_lola_quilted_bag.Variants.Add(new ProductVariant { Sku = "BUR-BAG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 49000000m, StockQuantity = 50 });
            allProducts.Add(prod_burberry_burberry_lola_quilted_bag);
            var prod_burberry_burberry_arthur_check_sneaker = new Product
            {
                SellerId = seller_burberry.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Arthur Vintage Check Low-Top",
                Slug = "burberry-burberry-arthur-check-sneaker",
                Sku = "BUR-SNEA-1",
                CollectionName = "Burberry Footwear",
                Description = "GiÃ y Sneaker Arthur Vintage Check Low-Top chÃ­nh hÃ£ng tá»« Burberry. Cháº¿ tÃ¡c tá»« Äáº¿ bá»c cao su chá»‘ng mÆ°a lá»™i nÆ°á»›c, thÃ¢n giÃ y váº£i check vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 23500000m,
                OriginalPrice = 26000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/burberry/burberry-arthur-check-sneaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/burberry/burberry-arthur-check-sneaker.jpg", "/img/brands/burberry/burberry-arthur-check-sneaker.jpg", "/img/brands/burberry/burberry-arthur-check-sneaker.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Äáº¿ bá»c cao su chá»‘ng mÆ°a lá»™i nÆ°á»›c, thÃ¢n giÃ y váº£i check",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Burberry, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Anh Quá»‘c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_burberry_burberry_arthur_check_sneaker.Variants.Add(new ProductVariant { Sku = "BUR-SNEA-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 23500000m, StockQuantity = 15 });
            prod_burberry_burberry_arthur_check_sneaker.Variants.Add(new ProductVariant { Sku = "BUR-SNEA-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 23500000m, StockQuantity = 20 });
            prod_burberry_burberry_arthur_check_sneaker.Variants.Add(new ProductVariant { Sku = "BUR-SNEA-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 23500000m, StockQuantity = 15 });
            allProducts.Add(prod_burberry_burberry_arthur_check_sneaker);
            var prod_burberry_burberry_reversible_wool_cape = new Product
            {
                SellerId = seller_burberry.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão ChoÃ ng Wool Reversible Check Poncho Cape",
                Slug = "burberry-burberry-reversible-wool-cape",
                Sku = "BUR-CAPE-2",
                CollectionName = "Burberry Ready-to-Wear",
                Description = "Ão ChoÃ ng Wool Reversible Check Poncho Cape chÃ­nh hÃ£ng tá»« Burberry. Cháº¿ tÃ¡c tá»« Len lÃ´ng cá»«u nguyÃªn cháº¥t dá»‡t hai máº·t, viá»n tua rua cá»• Ä‘iá»ƒn vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 36000000m,
                OriginalPrice = 41000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/burberry/burberry-reversible-wool-cape.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/burberry/burberry-reversible-wool-cape.jpg", "/img/brands/burberry/burberry-reversible-wool-cape.jpg", "/img/brands/burberry/burberry-reversible-wool-cape.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Len lÃ´ng cá»«u nguyÃªn cháº¥t dá»‡t hai máº·t, viá»n tua rua cá»• Ä‘iá»ƒn",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Burberry, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Anh Quá»‘c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_burberry_burberry_reversible_wool_cape.Variants.Add(new ProductVariant { Sku = "BUR-CAPE-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 36000000m, StockQuantity = 15 });
            prod_burberry_burberry_reversible_wool_cape.Variants.Add(new ProductVariant { Sku = "BUR-CAPE-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 36000000m, StockQuantity = 20 });
            prod_burberry_burberry_reversible_wool_cape.Variants.Add(new ProductVariant { Sku = "BUR-CAPE-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 36000000m, StockQuantity = 15 });
            allProducts.Add(prod_burberry_burberry_reversible_wool_cape);
            var prod_burberry_burberry_tb_monogram_belt = new Product
            {
                SellerId = seller_burberry.Id,
                CategoryId = catAccessories.Id,
                Name = "Tháº¯t LÆ°ng Da TB Monogram Plaque Leather Belt",
                Slug = "burberry-burberry-tb-monogram-belt",
                Sku = "BUR-BELT-3",
                CollectionName = "Burberry Accessories",
                Description = "Tháº¯t LÆ°ng Da TB Monogram Plaque Leather Belt chÃ­nh hÃ£ng tá»« Burberry. Cháº¿ tÃ¡c tá»« Da bÃª trÆ¡n má»‹n, máº·t khÃ³a chá»¯ TB máº¡ bÃ³ng phong cÃ¡ch hiá»‡n Ä‘áº¡i vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 12500000m,
                OriginalPrice = 14000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/burberry/burberry-tb-monogram-belt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/burberry/burberry-tb-monogram-belt.jpg", "/img/brands/burberry/burberry-tb-monogram-belt.jpg", "/img/brands/burberry/burberry-tb-monogram-belt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª trÆ¡n má»‹n, máº·t khÃ³a chá»¯ TB máº¡ bÃ³ng phong cÃ¡ch hiá»‡n Ä‘áº¡i",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Burberry, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Anh Quá»‘c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_burberry_burberry_tb_monogram_belt.Variants.Add(new ProductVariant { Sku = "BUR-BELT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 12500000m, StockQuantity = 50 });
            allProducts.Add(prod_burberry_burberry_tb_monogram_belt);
            var prod_burberry_burberry_check_cotton_shirt = new Product
            {
                SellerId = seller_burberry.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão SÆ¡ Mi Káº» Vintage Check Cotton Twill Shirt",
                Slug = "burberry-burberry-check-cotton-shirt",
                Sku = "BUR-SHIR-2",
                CollectionName = "Burberry Shirts",
                Description = "Ão SÆ¡ Mi Káº» Vintage Check Cotton Twill Shirt chÃ­nh hÃ£ng tá»« Burberry. Cháº¿ tÃ¡c tá»« Váº£i dá»‡t cotton twill thoÃ¡ng mÃ¡t in há»a tiáº¿t káº» Ã´ Burberry kinh Ä‘iá»ƒn vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 17500000m,
                OriginalPrice = 19500000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/burberry/burberry-check-cotton-shirt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/burberry/burberry-check-cotton-shirt.jpg", "/img/brands/burberry/burberry-check-cotton-shirt.jpg", "/img/brands/burberry/burberry-check-cotton-shirt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i dá»‡t cotton twill thoÃ¡ng mÃ¡t in há»a tiáº¿t káº» Ã´ Burberry kinh Ä‘iá»ƒn",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Burberry, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Anh Quá»‘c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_burberry_burberry_check_cotton_shirt.Variants.Add(new ProductVariant { Sku = "BUR-SHIR-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 17500000m, StockQuantity = 15 });
            prod_burberry_burberry_check_cotton_shirt.Variants.Add(new ProductVariant { Sku = "BUR-SHIR-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 17500000m, StockQuantity = 20 });
            prod_burberry_burberry_check_cotton_shirt.Variants.Add(new ProductVariant { Sku = "BUR-SHIR-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 17500000m, StockQuantity = 15 });
            allProducts.Add(prod_burberry_burberry_check_cotton_shirt);
            var prod_burberry_burberry_hero_eau_de_parfum = new Product
            {
                SellerId = seller_burberry.Id,
                CategoryId = catAccessories.Id,
                Name = "NÆ°á»›c Hoa Burberry Hero Eau de Parfum 100ml",
                Slug = "burberry-burberry-hero-eau-de-parfum",
                Sku = "BUR-PARF-3",
                CollectionName = "Burberry Fragrance",
                Description = "NÆ°á»›c Hoa Burberry Hero Eau de Parfum 100ml chÃ­nh hÃ£ng tá»« Burberry. Cháº¿ tÃ¡c tá»« HÆ°Æ¡ng gá»— tuyáº¿t tÃ¹ng ba vÃ¹ng nÃºi lá»­a, tiÃªu Ä‘en vÃ  tráº§m hÆ°Æ¡ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 3650000m,
                OriginalPrice = 4100000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/burberry/burberry-hero-eau-de-parfum.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/burberry/burberry-hero-eau-de-parfum.jpg", "/img/brands/burberry/burberry-hero-eau-de-parfum.jpg", "/img/brands/burberry/burberry-hero-eau-de-parfum.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "HÆ°Æ¡ng gá»— tuyáº¿t tÃ¹ng ba vÃ¹ng nÃºi lá»­a, tiÃªu Ä‘en vÃ  tráº§m hÆ°Æ¡ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Burberry, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Anh Quá»‘c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_burberry_burberry_hero_eau_de_parfum.Variants.Add(new ProductVariant { Sku = "BUR-PARF-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 3650000m, StockQuantity = 50 });
            allProducts.Add(prod_burberry_burberry_hero_eau_de_parfum);

            var seller_saintlaurent = dbUsers.First(u => u.Email == "saintlaurent@gmail.com");
            var prod_saintlaurent_saintlaurent_loulou_medium_bag = new Product
            {
                SellerId = seller_saintlaurent.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch LouLou Medium Quilted Leather Bag",
                Slug = "saintlaurent-saintlaurent-loulou-medium-bag",
                Sku = "SAI-BAG-3",
                CollectionName = "YSL LouLou Icons",
                Description = "TÃºi XÃ¡ch LouLou Medium Quilted Leather Bag chÃ­nh hÃ£ng tá»« Saint Laurent. Cháº¿ tÃ¡c tá»« Da bÃª thuá»™c má»m má»‹n may cháº§n chá»¯ Y, logo YSL kim loáº¡i báº¡c vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 78000000m,
                OriginalPrice = 86000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/saintlaurent/saintlaurent-loulou-medium-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/saintlaurent/saintlaurent-loulou-medium-bag.jpg", "/img/brands/saintlaurent/saintlaurent-loulou-medium-bag.jpg", "/img/brands/saintlaurent/saintlaurent-loulou-medium-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª thuá»™c má»m má»‹n may cháº§n chá»¯ Y, logo YSL kim loáº¡i báº¡c",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Saint Laurent, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_saintlaurent_saintlaurent_loulou_medium_bag.Variants.Add(new ProductVariant { Sku = "SAI-BAG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 78000000m, StockQuantity = 50 });
            allProducts.Add(prod_saintlaurent_saintlaurent_loulou_medium_bag);
            var prod_saintlaurent_saintlaurent_kate_chain_wallet = new Product
            {
                SellerId = seller_saintlaurent.Id,
                CategoryId = catAccessories.Id,
                Name = "VÃ­ XÃ­ch Cáº§m Tay Kate Chain Wallet Tassel",
                Slug = "saintlaurent-saintlaurent-kate-chain-wallet",
                Sku = "SAI-WALL-3",
                CollectionName = "YSL Kate",
                Description = "VÃ­ XÃ­ch Cáº§m Tay Kate Chain Wallet Tassel chÃ­nh hÃ£ng tá»« Saint Laurent. Cháº¿ tÃ¡c tá»« Da háº¡t sáº§n Grain de Poudre bá»n bá»‰, tua rua kim loáº¡i láº¯c kÃª vÃ ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 48000000m,
                OriginalPrice = 53000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/saintlaurent/saintlaurent-kate-chain-wallet.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/saintlaurent/saintlaurent-kate-chain-wallet.jpg", "/img/brands/saintlaurent/saintlaurent-kate-chain-wallet.jpg", "/img/brands/saintlaurent/saintlaurent-kate-chain-wallet.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da háº¡t sáº§n Grain de Poudre bá»n bá»‰, tua rua kim loáº¡i láº¯c kÃª vÃ ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Saint Laurent, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_saintlaurent_saintlaurent_kate_chain_wallet.Variants.Add(new ProductVariant { Sku = "SAI-WALL-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 48000000m, StockQuantity = 50 });
            allProducts.Add(prod_saintlaurent_saintlaurent_kate_chain_wallet);
            var prod_saintlaurent_saintlaurent_classic_biker_jacket = new Product
            {
                SellerId = seller_saintlaurent.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c Da Classic Biker Motorcycle Jacket",
                Slug = "saintlaurent-saintlaurent-classic-biker-jacket",
                Sku = "SAI-JACK-2",
                CollectionName = "Saint Laurent Permanent",
                Description = "Ão KhoÃ¡c Da Classic Biker Motorcycle Jacket chÃ­nh hÃ£ng tá»« Saint Laurent. Cháº¿ tÃ¡c tá»« Da cá»«u non Ã bÃ³ng nháº¹, phÃ©c-mÆ¡-tuy báº¥t Ä‘á»‘i xá»©ng phong cÃ¡ch rock vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 125000000m,
                OriginalPrice = 140000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/saintlaurent/saintlaurent-classic-biker-jacket.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/saintlaurent/saintlaurent-classic-biker-jacket.jpg", "/img/brands/saintlaurent/saintlaurent-classic-biker-jacket.jpg", "/img/brands/saintlaurent/saintlaurent-classic-biker-jacket.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da cá»«u non Ã bÃ³ng nháº¹, phÃ©c-mÆ¡-tuy báº¥t Ä‘á»‘i xá»©ng phong cÃ¡ch rock",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Saint Laurent, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_saintlaurent_saintlaurent_classic_biker_jacket.Variants.Add(new ProductVariant { Sku = "SAI-JACK-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 125000000m, StockQuantity = 15 });
            prod_saintlaurent_saintlaurent_classic_biker_jacket.Variants.Add(new ProductVariant { Sku = "SAI-JACK-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 125000000m, StockQuantity = 20 });
            prod_saintlaurent_saintlaurent_classic_biker_jacket.Variants.Add(new ProductVariant { Sku = "SAI-JACK-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 125000000m, StockQuantity = 15 });
            allProducts.Add(prod_saintlaurent_saintlaurent_classic_biker_jacket);
            var prod_saintlaurent_saintlaurent_tribute_heeled_sandals = new Product
            {
                SellerId = seller_saintlaurent.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Cao GÃ³t Tribute 105 Stiletto Platform Sandals",
                Slug = "saintlaurent-saintlaurent-tribute-heeled-sandals",
                Sku = "SAI-SAND-1",
                CollectionName = "YSL Tribute Footwear",
                Description = "GiÃ y Cao GÃ³t Tribute 105 Stiletto Platform Sandals chÃ­nh hÃ£ng tá»« Saint Laurent. Cháº¿ tÃ¡c tá»« DÃ¢y da Ä‘an chÃ©o váº¯t chÃ¢n duyÃªn dÃ¡ng, Ä‘áº¿ Ä‘Ãºp tÃ´n dÃ¡ng tá»‘i Ä‘a vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 27500000m,
                OriginalPrice = 31000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/saintlaurent/saintlaurent-tribute-heeled-sandals.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/saintlaurent/saintlaurent-tribute-heeled-sandals.jpg", "/img/brands/saintlaurent/saintlaurent-tribute-heeled-sandals.jpg", "/img/brands/saintlaurent/saintlaurent-tribute-heeled-sandals.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "DÃ¢y da Ä‘an chÃ©o váº¯t chÃ¢n duyÃªn dÃ¡ng, Ä‘áº¿ Ä‘Ãºp tÃ´n dÃ¡ng tá»‘i Ä‘a",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Saint Laurent, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_saintlaurent_saintlaurent_tribute_heeled_sandals.Variants.Add(new ProductVariant { Sku = "SAI-SAND-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 27500000m, StockQuantity = 15 });
            prod_saintlaurent_saintlaurent_tribute_heeled_sandals.Variants.Add(new ProductVariant { Sku = "SAI-SAND-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 27500000m, StockQuantity = 20 });
            prod_saintlaurent_saintlaurent_tribute_heeled_sandals.Variants.Add(new ProductVariant { Sku = "SAI-SAND-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 27500000m, StockQuantity = 15 });
            allProducts.Add(prod_saintlaurent_saintlaurent_tribute_heeled_sandals);
            var prod_saintlaurent_saintlaurent_court_classic_sneaker = new Product
            {
                SellerId = seller_saintlaurent.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Court Classic SL/06 Embroidered",
                Slug = "saintlaurent-saintlaurent-court-classic-sneaker",
                Sku = "SAI-SNEA-1",
                CollectionName = "YSL Court Classic",
                Description = "GiÃ y Sneaker Court Classic SL/06 Embroidered chÃ­nh hÃ£ng tá»« Saint Laurent. Cháº¿ tÃ¡c tá»« Da bÃª tráº¯ng Ã thÃªu chá»‰ Saint Laurent phong cÃ¡ch vintage lÃ£ng tá»­ vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 18500000m,
                OriginalPrice = 21000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/saintlaurent/saintlaurent-court-classic-sneaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/saintlaurent/saintlaurent-court-classic-sneaker.jpg", "/img/brands/saintlaurent/saintlaurent-court-classic-sneaker.jpg", "/img/brands/saintlaurent/saintlaurent-court-classic-sneaker.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª tráº¯ng Ã thÃªu chá»‰ Saint Laurent phong cÃ¡ch vintage lÃ£ng tá»­",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Saint Laurent, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_saintlaurent_saintlaurent_court_classic_sneaker.Variants.Add(new ProductVariant { Sku = "SAI-SNEA-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 18500000m, StockQuantity = 15 });
            prod_saintlaurent_saintlaurent_court_classic_sneaker.Variants.Add(new ProductVariant { Sku = "SAI-SNEA-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 18500000m, StockQuantity = 20 });
            prod_saintlaurent_saintlaurent_court_classic_sneaker.Variants.Add(new ProductVariant { Sku = "SAI-SNEA-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 18500000m, StockQuantity = 15 });
            allProducts.Add(prod_saintlaurent_saintlaurent_court_classic_sneaker);
            var prod_saintlaurent_saintlaurent_monogram_narrow_belt = new Product
            {
                SellerId = seller_saintlaurent.Id,
                CategoryId = catAccessories.Id,
                Name = "Tháº¯t LÆ°ng Da Monogram Narrow Square Buckle",
                Slug = "saintlaurent-saintlaurent-monogram-narrow-belt",
                Sku = "SAI-BELT-3",
                CollectionName = "YSL Belts",
                Description = "Tháº¯t LÆ°ng Da Monogram Narrow Square Buckle chÃ­nh hÃ£ng tá»« Saint Laurent. Cháº¿ tÃ¡c tá»« Da bÃ² dáº­p vÃ¢n tá»± nhiÃªn, vÃ²ng khuyÃªn luá»“n Ä‘Ã­nh logo YSL nhá» vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 11500000m,
                OriginalPrice = 13000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/saintlaurent/saintlaurent-monogram-narrow-belt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/saintlaurent/saintlaurent-monogram-narrow-belt.jpg", "/img/brands/saintlaurent/saintlaurent-monogram-narrow-belt.jpg", "/img/brands/saintlaurent/saintlaurent-monogram-narrow-belt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² dáº­p vÃ¢n tá»± nhiÃªn, vÃ²ng khuyÃªn luá»“n Ä‘Ã­nh logo YSL nhá»",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Saint Laurent, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_saintlaurent_saintlaurent_monogram_narrow_belt.Variants.Add(new ProductVariant { Sku = "SAI-BELT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 11500000m, StockQuantity = 50 });
            allProducts.Add(prod_saintlaurent_saintlaurent_monogram_narrow_belt);
            var prod_saintlaurent_saintlaurent_sl557_sunglasses = new Product
            {
                SellerId = seller_saintlaurent.Id,
                CategoryId = catAccessories.Id,
                Name = "KÃ­nh MÃ¡t DÃ y SL 557 Shade Oversized Sunglasses",
                Slug = "saintlaurent-saintlaurent-sl557-sunglasses",
                Sku = "SAI-SUNG-3",
                CollectionName = "YSL Eyewear",
                Description = "KÃ­nh MÃ¡t DÃ y SL 557 Shade Oversized Sunglasses chÃ­nh hÃ£ng tá»« Saint Laurent. Cháº¿ tÃ¡c tá»« Gá»ng Ä‘Ãºc vuÃ´ng Ä‘en bÃ³ng cÃ¡ tÃ­nh, báº£n lá» cháº¡m kháº¯c Saint Laurent vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 10500000m,
                OriginalPrice = 12000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/saintlaurent/saintlaurent-sl557-sunglasses.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/saintlaurent/saintlaurent-sl557-sunglasses.jpg", "/img/brands/saintlaurent/saintlaurent-sl557-sunglasses.jpg", "/img/brands/saintlaurent/saintlaurent-sl557-sunglasses.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Gá»ng Ä‘Ãºc vuÃ´ng Ä‘en bÃ³ng cÃ¡ tÃ­nh, báº£n lá» cháº¡m kháº¯c Saint Laurent",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Saint Laurent, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_saintlaurent_saintlaurent_sl557_sunglasses.Variants.Add(new ProductVariant { Sku = "SAI-SUNG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 10500000m, StockQuantity = 50 });
            allProducts.Add(prod_saintlaurent_saintlaurent_sl557_sunglasses);
            var prod_saintlaurent_saintlaurent_black_opium_parfum = new Product
            {
                SellerId = seller_saintlaurent.Id,
                CategoryId = catAccessories.Id,
                Name = "NÆ°á»›c Hoa Black Opium Eau de Parfum Extreme 90ml",
                Slug = "saintlaurent-saintlaurent-black-opium-parfum",
                Sku = "SAI-PARF-3",
                CollectionName = "YSL Beaute",
                Description = "NÆ°á»›c Hoa Black Opium Eau de Parfum Extreme 90ml chÃ­nh hÃ£ng tá»« Saint Laurent. Cháº¿ tÃ¡c tá»« HÆ°Æ¡ng cÃ  phÃª Ä‘en quyáº¿n rÅ©, vani Bourbon vÃ  hoa nhÃ i tráº¯ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 3950000m,
                OriginalPrice = 4500000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/saintlaurent/saintlaurent-black-opium-parfum.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/saintlaurent/saintlaurent-black-opium-parfum.jpg", "/img/brands/saintlaurent/saintlaurent-black-opium-parfum.jpg", "/img/brands/saintlaurent/saintlaurent-black-opium-parfum.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "HÆ°Æ¡ng cÃ  phÃª Ä‘en quyáº¿n rÅ©, vani Bourbon vÃ  hoa nhÃ i tráº¯ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Saint Laurent, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "PhÃ¡p",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_saintlaurent_saintlaurent_black_opium_parfum.Variants.Add(new ProductVariant { Sku = "SAI-PARF-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 3950000m, StockQuantity = 50 });
            allProducts.Add(prod_saintlaurent_saintlaurent_black_opium_parfum);

            var seller_fendi = dbUsers.First(u => u.Email == "fendi@gmail.com");
            var prod_fendi_fendi_baguette_medium_ff_bag = new Product
            {
                SellerId = seller_fendi.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Baguette Medium Leather FF Monogram",
                Slug = "fendi-fendi-baguette-medium-ff-bag",
                Sku = "FEN-BAG-3",
                CollectionName = "Fendi Baguette 1997",
                Description = "TÃºi XÃ¡ch Baguette Medium Leather FF Monogram chÃ­nh hÃ£ng tá»« Fendi. Cháº¿ tÃ¡c tá»« Da cá»«u nappa má»m dáº­p ná»•i há»a tiáº¿t FF, khÃ³a mÃ³c gáº­p FF kinh Ä‘iá»ƒn vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 85000000m,
                OriginalPrice = 93000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/fendi/fendi-baguette-medium-ff-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/fendi/fendi-baguette-medium-ff-bag.jpg", "/img/brands/fendi/fendi-baguette-medium-ff-bag.jpg", "/img/brands/fendi/fendi-baguette-medium-ff-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da cá»«u nappa má»m dáº­p ná»•i há»a tiáº¿t FF, khÃ³a mÃ³c gáº­p FF kinh Ä‘iá»ƒn",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Fendi, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_fendi_fendi_baguette_medium_ff_bag.Variants.Add(new ProductVariant { Sku = "FEN-BAG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 85000000m, StockQuantity = 50 });
            allProducts.Add(prod_fendi_fendi_baguette_medium_ff_bag);
            var prod_fendi_fendi_peekaboo_iseeu_handbag = new Product
            {
                SellerId = seller_fendi.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Peekaboo ISeeU Medium Calfskin",
                Slug = "fendi-fendi-peekaboo-iseeu-handbag",
                Sku = "FEN-HAND-3",
                CollectionName = "Fendi Peekaboo",
                Description = "TÃºi XÃ¡ch Peekaboo ISeeU Medium Calfskin chÃ­nh hÃ£ng tá»« Fendi. Cháº¿ tÃ¡c tá»« Da bÃª Cuoio Romano thá»§ cÃ´ng hai ngÄƒn riÃªng biá»‡t, khÃ³a xoay vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 135000000m,
                OriginalPrice = 150000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/fendi/fendi-peekaboo-iseeu-handbag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/fendi/fendi-peekaboo-iseeu-handbag.jpg", "/img/brands/fendi/fendi-peekaboo-iseeu-handbag.jpg", "/img/brands/fendi/fendi-peekaboo-iseeu-handbag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª Cuoio Romano thá»§ cÃ´ng hai ngÄƒn riÃªng biá»‡t, khÃ³a xoay",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Fendi, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_fendi_fendi_peekaboo_iseeu_handbag.Variants.Add(new ProductVariant { Sku = "FEN-HAND-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 135000000m, StockQuantity = 50 });
            allProducts.Add(prod_fendi_fendi_peekaboo_iseeu_handbag);
            var prod_fendi_fendi_colibri_slingback_pumps = new Product
            {
                SellerId = seller_fendi.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Slingback ColibrÃ¬ Lite Mesh & Technical Ribbon",
                Slug = "fendi-fendi-colibri-slingback-pumps",
                Sku = "FEN-PUMP-1",
                CollectionName = "Fendi ColibrÃ¬",
                Description = "GiÃ y Slingback ColibrÃ¬ Lite Mesh & Technical Ribbon chÃ­nh hÃ£ng tá»« Fendi. Cháº¿ tÃ¡c tá»« Cháº¥t lÆ°á»›i dá»‡t trong suá»‘t in FF monogram, quai háº­u Ä‘á»‡m thá»ƒ thao vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 26500000m,
                OriginalPrice = 29500000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/fendi/fendi-colibri-slingback-pumps.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/fendi/fendi-colibri-slingback-pumps.jpg", "/img/brands/fendi/fendi-colibri-slingback-pumps.jpg", "/img/brands/fendi/fendi-colibri-slingback-pumps.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Cháº¥t lÆ°á»›i dá»‡t trong suá»‘t in FF monogram, quai háº­u Ä‘á»‡m thá»ƒ thao",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Fendi, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_fendi_fendi_colibri_slingback_pumps.Variants.Add(new ProductVariant { Sku = "FEN-PUMP-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 26500000m, StockQuantity = 15 });
            prod_fendi_fendi_colibri_slingback_pumps.Variants.Add(new ProductVariant { Sku = "FEN-PUMP-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 26500000m, StockQuantity = 20 });
            prod_fendi_fendi_colibri_slingback_pumps.Variants.Add(new ProductVariant { Sku = "FEN-PUMP-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 26500000m, StockQuantity = 15 });
            allProducts.Add(prod_fendi_fendi_colibri_slingback_pumps);
            var prod_fendi_fendi_ff_jacquard_wool_sweater = new Product
            {
                SellerId = seller_fendi.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão Len Dá»‡t Kim FF Jacquard Wool & Cashmere",
                Slug = "fendi-fendi-ff-jacquard-wool-sweater",
                Sku = "FEN-SWEA-2",
                CollectionName = "Fendi Ready-to-Wear",
                Description = "Ão Len Dá»‡t Kim FF Jacquard Wool & Cashmere chÃ­nh hÃ£ng tá»« Fendi. Cháº¿ tÃ¡c tá»« Sá»£i len lÃ´ng cá»«u pha cashmere cao cáº¥p dá»‡t hoa vÄƒn FF hai tÃ´ng mÃ u vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 34000000m,
                OriginalPrice = 38000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/fendi/fendi-ff-jacquard-wool-sweater.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/fendi/fendi-ff-jacquard-wool-sweater.jpg", "/img/brands/fendi/fendi-ff-jacquard-wool-sweater.jpg", "/img/brands/fendi/fendi-ff-jacquard-wool-sweater.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Sá»£i len lÃ´ng cá»«u pha cashmere cao cáº¥p dá»‡t hoa vÄƒn FF hai tÃ´ng mÃ u",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Fendi, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_fendi_fendi_ff_jacquard_wool_sweater.Variants.Add(new ProductVariant { Sku = "FEN-SWEA-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 34000000m, StockQuantity = 15 });
            prod_fendi_fendi_ff_jacquard_wool_sweater.Variants.Add(new ProductVariant { Sku = "FEN-SWEA-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 34000000m, StockQuantity = 20 });
            prod_fendi_fendi_ff_jacquard_wool_sweater.Variants.Add(new ProductVariant { Sku = "FEN-SWEA-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 34000000m, StockQuantity = 15 });
            allProducts.Add(prod_fendi_fendi_ff_jacquard_wool_sweater);
            var prod_fendi_fendi_ff_buckle_leather_belt = new Product
            {
                SellerId = seller_fendi.Id,
                CategoryId = catAccessories.Id,
                Name = "Tháº¯t LÆ°ng Da FF Buckle Reversible Calf Leather",
                Slug = "fendi-fendi-ff-buckle-leather-belt",
                Sku = "FEN-BELT-3",
                CollectionName = "Fendi Accessories",
                Description = "Tháº¯t LÆ°ng Da FF Buckle Reversible Calf Leather chÃ­nh hÃ£ng tá»« Fendi. Cháº¿ tÃ¡c tá»« Da bÃª Ä‘en/nÃ¢u hai máº·t, máº·t khÃ³a chá»¯ FF máº¡ bÃ³ng sang trá»ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 14500000m,
                OriginalPrice = 16500000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/fendi/fendi-ff-buckle-leather-belt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/fendi/fendi-ff-buckle-leather-belt.jpg", "/img/brands/fendi/fendi-ff-buckle-leather-belt.jpg", "/img/brands/fendi/fendi-ff-buckle-leather-belt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª Ä‘en/nÃ¢u hai máº·t, máº·t khÃ³a chá»¯ FF máº¡ bÃ³ng sang trá»ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Fendi, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_fendi_fendi_ff_buckle_leather_belt.Variants.Add(new ProductVariant { Sku = "FEN-BELT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 14500000m, StockQuantity = 50 });
            allProducts.Add(prod_fendi_fendi_ff_buckle_leather_belt);
            var prod_fendi_fendi_match_suede_sneaker = new Product
            {
                SellerId = seller_fendi.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Fendi Match Suede & Leather Low-Top",
                Slug = "fendi-fendi-match-suede-sneaker",
                Sku = "FEN-SNEA-1",
                CollectionName = "Fendi Footwear",
                Description = "GiÃ y Sneaker Fendi Match Suede & Leather Low-Top chÃ­nh hÃ£ng tá»« Fendi. Cháº¿ tÃ¡c tá»« Da lá»™n phá»‘i da trÆ¡n phong cÃ¡ch bÃ³ng rá»• cá»• Ä‘iá»ƒn, logo FF bá»c da vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 24500000m,
                OriginalPrice = 27500000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/fendi/fendi-match-suede-sneaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/fendi/fendi-match-suede-sneaker.jpg", "/img/brands/fendi/fendi-match-suede-sneaker.jpg", "/img/brands/fendi/fendi-match-suede-sneaker.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da lá»™n phá»‘i da trÆ¡n phong cÃ¡ch bÃ³ng rá»• cá»• Ä‘iá»ƒn, logo FF bá»c da",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Fendi, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_fendi_fendi_match_suede_sneaker.Variants.Add(new ProductVariant { Sku = "FEN-SNEA-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 24500000m, StockQuantity = 15 });
            prod_fendi_fendi_match_suede_sneaker.Variants.Add(new ProductVariant { Sku = "FEN-SNEA-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 24500000m, StockQuantity = 20 });
            prod_fendi_fendi_match_suede_sneaker.Variants.Add(new ProductVariant { Sku = "FEN-SNEA-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 24500000m, StockQuantity = 15 });
            allProducts.Add(prod_fendi_fendi_match_suede_sneaker);
            var prod_fendi_fendi_diamonds_square_sunglasses = new Product
            {
                SellerId = seller_fendi.Id,
                CategoryId = catAccessories.Id,
                Name = "KÃ­nh MÃ¡t Chá»¯ Nháº­t FF Diamonds Square Frame",
                Slug = "fendi-fendi-diamonds-square-sunglasses",
                Sku = "FEN-SUNG-3",
                CollectionName = "Fendi Eyewear",
                Description = "KÃ­nh MÃ¡t Chá»¯ Nháº­t FF Diamonds Square Frame chÃ­nh hÃ£ng tá»« Fendi. Cháº¿ tÃ¡c tá»« Gá»ng kim loáº¡i thanh máº£nh cháº¡m há»a tiáº¿t kim cÆ°Æ¡ng vÃ  logo FF vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 11500000m,
                OriginalPrice = 13000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/fendi/fendi-diamonds-square-sunglasses.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/fendi/fendi-diamonds-square-sunglasses.jpg", "/img/brands/fendi/fendi-diamonds-square-sunglasses.jpg", "/img/brands/fendi/fendi-diamonds-square-sunglasses.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Gá»ng kim loáº¡i thanh máº£nh cháº¡m há»a tiáº¿t kim cÆ°Æ¡ng vÃ  logo FF",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Fendi, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_fendi_fendi_diamonds_square_sunglasses.Variants.Add(new ProductVariant { Sku = "FEN-SUNG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 11500000m, StockQuantity = 50 });
            allProducts.Add(prod_fendi_fendi_diamonds_square_sunglasses);
            var prod_fendi_fendi_sunshine_shopper_tote = new Product
            {
                SellerId = seller_fendi.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi Tote Sunshine Medium FF Jacquard Canvas",
                Slug = "fendi-fendi-sunshine-shopper-tote",
                Sku = "FEN-TOTE-3",
                CollectionName = "Fendi Sunshine",
                Description = "TÃºi Tote Sunshine Medium FF Jacquard Canvas chÃ­nh hÃ£ng tá»« Fendi. Cháº¿ tÃ¡c tá»« Váº£i Canvas dá»‡t FF, tay cáº§m báº±ng kÃ­nh Plexiglas Ä‘á»“i má»“i sang trá»ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 72000000m,
                OriginalPrice = 80000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/fendi/fendi-sunshine-shopper-tote.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/fendi/fendi-sunshine-shopper-tote.jpg", "/img/brands/fendi/fendi-sunshine-shopper-tote.jpg", "/img/brands/fendi/fendi-sunshine-shopper-tote.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i Canvas dá»‡t FF, tay cáº§m báº±ng kÃ­nh Plexiglas Ä‘á»“i má»“i sang trá»ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Fendi, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_fendi_fendi_sunshine_shopper_tote.Variants.Add(new ProductVariant { Sku = "FEN-TOTE-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 72000000m, StockQuantity = 50 });
            allProducts.Add(prod_fendi_fendi_sunshine_shopper_tote);

            var seller_bottegaveneta = dbUsers.First(u => u.Email == "bottegaveneta@gmail.com");
            var prod_bottegaveneta_bottegaveneta_the_pouch_clutch = new Product
            {
                SellerId = seller_bottegaveneta.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi Cáº§m Tay The Pouch Soft Gathered Calfskin",
                Slug = "bottegaveneta-bottegaveneta-the-pouch-clutch",
                Sku = "BOT-CLUT-3",
                CollectionName = "Bottega The Pouch",
                Description = "TÃºi Cáº§m Tay The Pouch Soft Gathered Calfskin chÃ­nh hÃ£ng tá»« Bottega Veneta. Cháº¿ tÃ¡c tá»« Da bÃª non náº¿p gáº¥p má»m máº¡i nhÆ° mÃ¢y, khung nam chÃ¢m áº©n vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 78000000m,
                OriginalPrice = 86000000m,
                DiscountPercent = 9,
                ImageUrl = "/img/brands/bottegaveneta/bottegaveneta-the-pouch-clutch.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/bottegaveneta/bottegaveneta-the-pouch-clutch.jpg", "/img/brands/bottegaveneta/bottegaveneta-the-pouch-clutch.jpg", "/img/brands/bottegaveneta/bottegaveneta-the-pouch-clutch.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª non náº¿p gáº¥p má»m máº¡i nhÆ° mÃ¢y, khung nam chÃ¢m áº©n",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Bottega Veneta, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_bottegaveneta_bottegaveneta_the_pouch_clutch.Variants.Add(new ProductVariant { Sku = "BOT-CLUT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 78000000m, StockQuantity = 50 });
            allProducts.Add(prod_bottegaveneta_bottegaveneta_the_pouch_clutch);
            var prod_bottegaveneta_bottegaveneta_jodie_mini_hobo = new Product
            {
                SellerId = seller_bottegaveneta.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Jodie Mini Knotted Intrecciato Leather",
                Slug = "bottegaveneta-bottegaveneta-jodie-mini-hobo",
                Sku = "BOT-HOBO-3",
                CollectionName = "Bottega Jodie",
                Description = "TÃºi XÃ¡ch Jodie Mini Knotted Intrecciato Leather chÃ­nh hÃ£ng tá»« Bottega Veneta. Cháº¿ tÃ¡c tá»« Da cá»«u nappa Ä‘an Intrecciato thá»§ cÃ´ng, tay cáº§m tháº¯t nÃºt Ä‘áº·c trÆ°ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 62000000m,
                OriginalPrice = 69000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/bottegaveneta/bottegaveneta-jodie-mini-hobo.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/bottegaveneta/bottegaveneta-jodie-mini-hobo.jpg", "/img/brands/bottegaveneta/bottegaveneta-jodie-mini-hobo.jpg", "/img/brands/bottegaveneta/bottegaveneta-jodie-mini-hobo.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da cá»«u nappa Ä‘an Intrecciato thá»§ cÃ´ng, tay cáº§m tháº¯t nÃºt Ä‘áº·c trÆ°ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Bottega Veneta, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_bottegaveneta_bottegaveneta_jodie_mini_hobo.Variants.Add(new ProductVariant { Sku = "BOT-HOBO-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 62000000m, StockQuantity = 50 });
            allProducts.Add(prod_bottegaveneta_bottegaveneta_jodie_mini_hobo);
            var prod_bottegaveneta_bottegaveneta_cassette_padded_bag = new Product
            {
                SellerId = seller_bottegaveneta.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi Äeo ChÃ©o Cassette Padded Crossbody Bag",
                Slug = "bottegaveneta-bottegaveneta-cassette-padded-bag",
                Sku = "BOT-BAG-3",
                CollectionName = "Bottega Cassette",
                Description = "TÃºi Äeo ChÃ©o Cassette Padded Crossbody Bag chÃ­nh hÃ£ng tá»« Bottega Veneta. Cháº¿ tÃ¡c tá»« Ká»¹ thuáº­t Ä‘an da báº£n lá»›n dáº­p phá»“ng cháº§n bÃ´ng hai máº·t vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 85000000m,
                OriginalPrice = 95000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/bottegaveneta/bottegaveneta-cassette-padded-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/bottegaveneta/bottegaveneta-cassette-padded-bag.jpg", "/img/brands/bottegaveneta/bottegaveneta-cassette-padded-bag.jpg", "/img/brands/bottegaveneta/bottegaveneta-cassette-padded-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Ká»¹ thuáº­t Ä‘an da báº£n lá»›n dáº­p phá»“ng cháº§n bÃ´ng hai máº·t",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Bottega Veneta, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_bottegaveneta_bottegaveneta_cassette_padded_bag.Variants.Add(new ProductVariant { Sku = "BOT-BAG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 85000000m, StockQuantity = 50 });
            allProducts.Add(prod_bottegaveneta_bottegaveneta_cassette_padded_bag);
            var prod_bottegaveneta_bottegaveneta_tire_chelsea_boots = new Product
            {
                SellerId = seller_bottegaveneta.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Bá»‘t Tire Lug-Sole Chelsea Ankle Boots",
                Slug = "bottegaveneta-bottegaveneta-tire-chelsea-boots",
                Sku = "BOT-BOOT-1",
                CollectionName = "Bottega Tire Footwear",
                Description = "GiÃ y Bá»‘t Tire Lug-Sole Chelsea Ankle Boots chÃ­nh hÃ£ng tá»« Bottega Veneta. Cháº¿ tÃ¡c tá»« Da bÃª sÃ¡p dÃ y dáº·n, Ä‘áº¿ cao su uá»‘n lÆ°á»£n phong cÃ¡ch viá»…n tÆ°á»Ÿng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 35000000m,
                OriginalPrice = 39000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/bottegaveneta/bottegaveneta-tire-chelsea-boots.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/bottegaveneta/bottegaveneta-tire-chelsea-boots.jpg", "/img/brands/bottegaveneta/bottegaveneta-tire-chelsea-boots.jpg", "/img/brands/bottegaveneta/bottegaveneta-tire-chelsea-boots.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª sÃ¡p dÃ y dáº·n, Ä‘áº¿ cao su uá»‘n lÆ°á»£n phong cÃ¡ch viá»…n tÆ°á»Ÿng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Bottega Veneta, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_bottegaveneta_bottegaveneta_tire_chelsea_boots.Variants.Add(new ProductVariant { Sku = "BOT-BOOT-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 35000000m, StockQuantity = 15 });
            prod_bottegaveneta_bottegaveneta_tire_chelsea_boots.Variants.Add(new ProductVariant { Sku = "BOT-BOOT-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 35000000m, StockQuantity = 20 });
            prod_bottegaveneta_bottegaveneta_tire_chelsea_boots.Variants.Add(new ProductVariant { Sku = "BOT-BOOT-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 35000000m, StockQuantity = 15 });
            allProducts.Add(prod_bottegaveneta_bottegaveneta_tire_chelsea_boots);
            var prod_bottegaveneta_bottegaveneta_intrecciato_wallet = new Product
            {
                SellerId = seller_bottegaveneta.Id,
                CategoryId = catAccessories.Id,
                Name = "VÃ­ Gáº­p DÃ i Intrecciato Weave Leather Wallet",
                Slug = "bottegaveneta-bottegaveneta-intrecciato-wallet",
                Sku = "BOT-WALL-3",
                CollectionName = "Bottega Small Leather",
                Description = "VÃ­ Gáº­p DÃ i Intrecciato Weave Leather Wallet chÃ­nh hÃ£ng tá»« Bottega Veneta. Cháº¿ tÃ¡c tá»« Da cá»«u Ä‘an tay truyá»n thá»‘ng vÃ¹ng Veneto, 12 ngÄƒn tháº» rá»™ng rÃ£i vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 22500000m,
                OriginalPrice = 25500000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/bottegaveneta/bottegaveneta-intrecciato-wallet.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/bottegaveneta/bottegaveneta-intrecciato-wallet.jpg", "/img/brands/bottegaveneta/bottegaveneta-intrecciato-wallet.jpg", "/img/brands/bottegaveneta/bottegaveneta-intrecciato-wallet.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da cá»«u Ä‘an tay truyá»n thá»‘ng vÃ¹ng Veneto, 12 ngÄƒn tháº» rá»™ng rÃ£i",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Bottega Veneta, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_bottegaveneta_bottegaveneta_intrecciato_wallet.Variants.Add(new ProductVariant { Sku = "BOT-WALL-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 22500000m, StockQuantity = 50 });
            allProducts.Add(prod_bottegaveneta_bottegaveneta_intrecciato_wallet);
            var prod_bottegaveneta_bottegaveneta_stretch_heeled_sandals = new Product
            {
                SellerId = seller_bottegaveneta.Id,
                CategoryId = catSneaker.Id,
                Name = "DÃ©p Cao GÃ³t Stretch Square-Toe Heeled Sandals",
                Slug = "bottegaveneta-bottegaveneta-stretch-heeled-sandals",
                Sku = "BOT-SAND-1",
                CollectionName = "Bottega Stretch",
                Description = "DÃ©p Cao GÃ³t Stretch Square-Toe Heeled Sandals chÃ­nh hÃ£ng tá»« Bottega Veneta. Cháº¿ tÃ¡c tá»« MÅ©i vuÃ´ng cÃ¡ tÃ­nh quai máº£nh, Ä‘áº¿ cao su Ä‘á»‡m chá»‘ng trÆ°á»£t vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 26000000m,
                OriginalPrice = 29000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/bottegaveneta/bottegaveneta-stretch-heeled-sandals.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/bottegaveneta/bottegaveneta-stretch-heeled-sandals.jpg", "/img/brands/bottegaveneta/bottegaveneta-stretch-heeled-sandals.jpg", "/img/brands/bottegaveneta/bottegaveneta-stretch-heeled-sandals.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "MÅ©i vuÃ´ng cÃ¡ tÃ­nh quai máº£nh, Ä‘áº¿ cao su Ä‘á»‡m chá»‘ng trÆ°á»£t",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Bottega Veneta, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_bottegaveneta_bottegaveneta_stretch_heeled_sandals.Variants.Add(new ProductVariant { Sku = "BOT-SAND-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 26000000m, StockQuantity = 15 });
            prod_bottegaveneta_bottegaveneta_stretch_heeled_sandals.Variants.Add(new ProductVariant { Sku = "BOT-SAND-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 26000000m, StockQuantity = 20 });
            prod_bottegaveneta_bottegaveneta_stretch_heeled_sandals.Variants.Add(new ProductVariant { Sku = "BOT-SAND-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 26000000m, StockQuantity = 15 });
            allProducts.Add(prod_bottegaveneta_bottegaveneta_stretch_heeled_sandals);
            var prod_bottegaveneta_bottegaveneta_flash_sole_boots = new Product
            {
                SellerId = seller_bottegaveneta.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Bá»‘t Flash Chunky Sole Leather Boots",
                Slug = "bottegaveneta-bottegaveneta-flash-sole-boots",
                Sku = "BOT-BOOT-2",
                CollectionName = "Bottega Flash",
                Description = "GiÃ y Bá»‘t Flash Chunky Sole Leather Boots chÃ­nh hÃ£ng tá»« Bottega Veneta. Cháº¿ tÃ¡c tá»« Äáº¿ Ä‘Ãºc mÃ u dáº¡ quang tÆ°Æ¡ng pháº£n ná»•i báº­t, da trÆ¡n khÃ¡ng nÆ°á»›c vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 38000000m,
                OriginalPrice = 42000000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/bottegaveneta/bottegaveneta-flash-sole-boots.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/bottegaveneta/bottegaveneta-flash-sole-boots.jpg", "/img/brands/bottegaveneta/bottegaveneta-flash-sole-boots.jpg", "/img/brands/bottegaveneta/bottegaveneta-flash-sole-boots.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Äáº¿ Ä‘Ãºc mÃ u dáº¡ quang tÆ°Æ¡ng pháº£n ná»•i báº­t, da trÆ¡n khÃ¡ng nÆ°á»›c",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Bottega Veneta, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_bottegaveneta_bottegaveneta_flash_sole_boots.Variants.Add(new ProductVariant { Sku = "BOT-BOOT-2-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 38000000m, StockQuantity = 15 });
            prod_bottegaveneta_bottegaveneta_flash_sole_boots.Variants.Add(new ProductVariant { Sku = "BOT-BOOT-2-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 38000000m, StockQuantity = 20 });
            prod_bottegaveneta_bottegaveneta_flash_sole_boots.Variants.Add(new ProductVariant { Sku = "BOT-BOOT-2-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 38000000m, StockQuantity = 15 });
            allProducts.Add(prod_bottegaveneta_bottegaveneta_flash_sole_boots);
            var prod_bottegaveneta_bottegaveneta_cat_eye_sunglasses = new Product
            {
                SellerId = seller_bottegaveneta.Id,
                CategoryId = catAccessories.Id,
                Name = "KÃ­nh MÃ¡t Máº¯t MÃ¨o Cat-Eye Acetate Sunglasses",
                Slug = "bottegaveneta-bottegaveneta-cat-eye-sunglasses",
                Sku = "BOT-SUNG-3",
                CollectionName = "Bottega Eyewear",
                Description = "KÃ­nh MÃ¡t Máº¯t MÃ¨o Cat-Eye Acetate Sunglasses chÃ­nh hÃ£ng tá»« Bottega Veneta. Cháº¿ tÃ¡c tá»« Gá»ng kÃ­nh vuá»‘t nhá»n Ä‘Ã­nh chi tiáº¿t ruy bÄƒng kim loáº¡i vÃ ng á»Ÿ báº£n lá» vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 11500000m,
                OriginalPrice = 13000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/bottegaveneta/bottegaveneta-cat-eye-sunglasses.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/bottegaveneta/bottegaveneta-cat-eye-sunglasses.jpg", "/img/brands/bottegaveneta/bottegaveneta-cat-eye-sunglasses.jpg", "/img/brands/bottegaveneta/bottegaveneta-cat-eye-sunglasses.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Gá»ng kÃ­nh vuá»‘t nhá»n Ä‘Ã­nh chi tiáº¿t ruy bÄƒng kim loáº¡i vÃ ng á»Ÿ báº£n lá»",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Bottega Veneta, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_bottegaveneta_bottegaveneta_cat_eye_sunglasses.Variants.Add(new ProductVariant { Sku = "BOT-SUNG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 11500000m, StockQuantity = 50 });
            allProducts.Add(prod_bottegaveneta_bottegaveneta_cat_eye_sunglasses);

            var seller_offwhite = dbUsers.First(u => u.Email == "offwhite@gmail.com");
            var prod_offwhite_offwhite_jitney_28_top_handle = new Product
            {
                SellerId = seller_offwhite.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Jitney 2.8 Top Handle Leather Bag",
                Slug = "offwhite-offwhite-jitney-28-top-handle",
                Sku = "OFF-HAND-3",
                CollectionName = "Off-White Jitney",
                Description = "TÃºi XÃ¡ch Jitney 2.8 Top Handle Leather Bag chÃ­nh hÃ£ng tá»« Off-White. Cháº¿ tÃ¡c tá»« Da bÃª trÆ¡n in chá»¯ typography, khÃ³a kim loáº¡i mÅ©i tÃªn xoay vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 38000000m,
                OriginalPrice = 43000000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/offwhite/offwhite-jitney-28-top-handle.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/offwhite/offwhite-jitney-28-top-handle.jpg", "/img/brands/offwhite/offwhite-jitney-28-top-handle.jpg", "/img/brands/offwhite/offwhite-jitney-28-top-handle.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª trÆ¡n in chá»¯ typography, khÃ³a kim loáº¡i mÅ©i tÃªn xoay",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Off-White, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã / Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_offwhite_offwhite_jitney_28_top_handle.Variants.Add(new ProductVariant { Sku = "OFF-HAND-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 38000000m, StockQuantity = 50 });
            allProducts.Add(prod_offwhite_offwhite_jitney_28_top_handle);
            var prod_offwhite_offwhite_out_of_office_sneaker = new Product
            {
                SellerId = seller_offwhite.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Out Of Office (OOO) Low-Top",
                Slug = "offwhite-offwhite-out-of-office-sneaker",
                Sku = "OFF-SNEA-1",
                CollectionName = "Off-White OOO Footwear",
                Description = "GiÃ y Sneaker Out Of Office (OOO) Low-Top chÃ­nh hÃ£ng tá»« Off-White. Cháº¿ tÃ¡c tá»« Da bÃª Ã phá»‘i máº£ng mÃ u tÆ°Æ¡ng pháº£n, tag zip-tie da cÃ¡ tÃ­nh vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 16500000m,
                OriginalPrice = 18500000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/offwhite/offwhite-out-of-office-sneaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/offwhite/offwhite-out-of-office-sneaker.jpg", "/img/brands/offwhite/offwhite-out-of-office-sneaker.jpg", "/img/brands/offwhite/offwhite-out-of-office-sneaker.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª Ã phá»‘i máº£ng mÃ u tÆ°Æ¡ng pháº£n, tag zip-tie da cÃ¡ tÃ­nh",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Off-White, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã / Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_offwhite_offwhite_out_of_office_sneaker.Variants.Add(new ProductVariant { Sku = "OFF-SNEA-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 16500000m, StockQuantity = 15 });
            prod_offwhite_offwhite_out_of_office_sneaker.Variants.Add(new ProductVariant { Sku = "OFF-SNEA-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 16500000m, StockQuantity = 20 });
            prod_offwhite_offwhite_out_of_office_sneaker.Variants.Add(new ProductVariant { Sku = "OFF-SNEA-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 16500000m, StockQuantity = 15 });
            allProducts.Add(prod_offwhite_offwhite_out_of_office_sneaker);
            var prod_offwhite_offwhite_industrial_yellow_belt = new Product
            {
                SellerId = seller_offwhite.Id,
                CategoryId = catAccessories.Id,
                Name = "Tháº¯t LÆ°ng DÃ¢y Báº£n Industrial Yellow Logo Belt",
                Slug = "offwhite-offwhite-industrial-yellow-belt",
                Sku = "OFF-BELT-3",
                CollectionName = "Off-White Industrial",
                Description = "Tháº¯t LÆ°ng DÃ¢y Báº£n Industrial Yellow Logo Belt chÃ­nh hÃ£ng tá»« Off-White. Cháº¿ tÃ¡c tá»« DÃ¢y dá»‡t cÃ´ng nghiá»‡p 200cm mÃ u vÃ ng neon thÃªu chá»¯ Off-White vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 8500000m,
                OriginalPrice = 9800000m,
                DiscountPercent = 13,
                ImageUrl = "/img/brands/offwhite/offwhite-industrial-yellow-belt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/offwhite/offwhite-industrial-yellow-belt.jpg", "/img/brands/offwhite/offwhite-industrial-yellow-belt.jpg", "/img/brands/offwhite/offwhite-industrial-yellow-belt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "DÃ¢y dá»‡t cÃ´ng nghiá»‡p 200cm mÃ u vÃ ng neon thÃªu chá»¯ Off-White",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Off-White, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã / Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_offwhite_offwhite_industrial_yellow_belt.Variants.Add(new ProductVariant { Sku = "OFF-BELT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 8500000m, StockQuantity = 50 });
            allProducts.Add(prod_offwhite_offwhite_industrial_yellow_belt);
            var prod_offwhite_offwhite_caravaggio_arrows_hoodie = new Product
            {
                SellerId = seller_offwhite.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão Ná»‰ CÃ³ MÅ© Caravaggio Arrows Graphic Hoodie",
                Slug = "offwhite-offwhite-caravaggio-arrows-hoodie",
                Sku = "OFF-HOOD-2",
                CollectionName = "Off-White Caravaggio",
                Description = "Ão Ná»‰ CÃ³ MÅ© Caravaggio Arrows Graphic Hoodie chÃ­nh hÃ£ng tá»« Off-White. Cháº¿ tÃ¡c tá»« Ná»‰ bÃ´ng cotton dÃ y 450gsm, in tranh danh há»a Caravaggio vÃ  mÅ©i tÃªn vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 17500000m,
                OriginalPrice = 19500000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/offwhite/offwhite-caravaggio-arrows-hoodie.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/offwhite/offwhite-caravaggio-arrows-hoodie.jpg", "/img/brands/offwhite/offwhite-caravaggio-arrows-hoodie.jpg", "/img/brands/offwhite/offwhite-caravaggio-arrows-hoodie.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Ná»‰ bÃ´ng cotton dÃ y 450gsm, in tranh danh há»a Caravaggio vÃ  mÅ©i tÃªn",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Off-White, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã / Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_offwhite_offwhite_caravaggio_arrows_hoodie.Variants.Add(new ProductVariant { Sku = "OFF-HOOD-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 17500000m, StockQuantity = 15 });
            prod_offwhite_offwhite_caravaggio_arrows_hoodie.Variants.Add(new ProductVariant { Sku = "OFF-HOOD-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 17500000m, StockQuantity = 20 });
            prod_offwhite_offwhite_caravaggio_arrows_hoodie.Variants.Add(new ProductVariant { Sku = "OFF-HOOD-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 17500000m, StockQuantity = 15 });
            allProducts.Add(prod_offwhite_offwhite_caravaggio_arrows_hoodie);
            var prod_offwhite_offwhite_vulcanized_canvas_sneaker = new Product
            {
                SellerId = seller_offwhite.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Low Vulcanized Canvas Sneaker",
                Slug = "offwhite-offwhite-vulcanized-canvas-sneaker",
                Sku = "OFF-SNEA-2",
                CollectionName = "Off-White Vulcanized",
                Description = "GiÃ y Sneaker Low Vulcanized Canvas Sneaker chÃ­nh hÃ£ng tá»« Off-White. Cháº¿ tÃ¡c tá»« Váº£i canvas bá»n cháº¯c, há»a tiáº¿t káº» sá»c Diag sá»c chÃ©o thÃ¢n giÃ y vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 9500000m,
                OriginalPrice = 11000000m,
                DiscountPercent = 14,
                ImageUrl = "/img/brands/offwhite/offwhite-vulcanized-canvas-sneaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/offwhite/offwhite-vulcanized-canvas-sneaker.jpg", "/img/brands/offwhite/offwhite-vulcanized-canvas-sneaker.jpg", "/img/brands/offwhite/offwhite-vulcanized-canvas-sneaker.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i canvas bá»n cháº¯c, há»a tiáº¿t káº» sá»c Diag sá»c chÃ©o thÃ¢n giÃ y",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Off-White, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã / Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_offwhite_offwhite_vulcanized_canvas_sneaker.Variants.Add(new ProductVariant { Sku = "OFF-SNEA-2-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 9500000m, StockQuantity = 15 });
            prod_offwhite_offwhite_vulcanized_canvas_sneaker.Variants.Add(new ProductVariant { Sku = "OFF-SNEA-2-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 9500000m, StockQuantity = 20 });
            prod_offwhite_offwhite_vulcanized_canvas_sneaker.Variants.Add(new ProductVariant { Sku = "OFF-SNEA-2-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 9500000m, StockQuantity = 15 });
            allProducts.Add(prod_offwhite_offwhite_vulcanized_canvas_sneaker);
            var prod_offwhite_offwhite_diag_flap_crossbody = new Product
            {
                SellerId = seller_offwhite.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi Äeo ChÃ©o Diag Flap Crossbody Leather Bag",
                Slug = "offwhite-offwhite-diag-flap-crossbody",
                Sku = "OFF-CROS-3",
                CollectionName = "Off-White Diag Icons",
                Description = "TÃºi Äeo ChÃ©o Diag Flap Crossbody Leather Bag chÃ­nh hÃ£ng tá»« Off-White. Cháº¿ tÃ¡c tá»« Da bÃª dáº­p há»a tiáº¿t sá»c chÃ©o pháº£n quang, quai Ä‘eo váº£i cÃ´ng nghiá»‡p vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 28500000m,
                OriginalPrice = 32000000m,
                DiscountPercent = 11,
                ImageUrl = "/img/brands/offwhite/offwhite-diag-flap-crossbody.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/offwhite/offwhite-diag-flap-crossbody.jpg", "/img/brands/offwhite/offwhite-diag-flap-crossbody.jpg", "/img/brands/offwhite/offwhite-diag-flap-crossbody.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª dáº­p há»a tiáº¿t sá»c chÃ©o pháº£n quang, quai Ä‘eo váº£i cÃ´ng nghiá»‡p",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Off-White, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã / Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_offwhite_offwhite_diag_flap_crossbody.Variants.Add(new ProductVariant { Sku = "OFF-CROS-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 28500000m, StockQuantity = 50 });
            allProducts.Add(prod_offwhite_offwhite_diag_flap_crossbody);
            var prod_offwhite_offwhite_typography_leather_wallet = new Product
            {
                SellerId = seller_offwhite.Id,
                CategoryId = catAccessories.Id,
                Name = "VÃ­ Da Gáº­p Quote Typography Bifold Leather Wallet",
                Slug = "offwhite-offwhite-typography-leather-wallet",
                Sku = "OFF-WALL-3",
                CollectionName = "Off-White Accessories",
                Description = "VÃ­ Da Gáº­p Quote Typography Bifold Leather Wallet chÃ­nh hÃ£ng tá»« Off-White. Cháº¿ tÃ¡c tá»« Da bÃª Ä‘en in chá»¯ 'WALLET' trong dáº¥u ngoáº·c kÃ©p phong cÃ¡ch Virgil vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 8900000m,
                OriginalPrice = 10500000m,
                DiscountPercent = 15,
                ImageUrl = "/img/brands/offwhite/offwhite-typography-leather-wallet.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/offwhite/offwhite-typography-leather-wallet.jpg", "/img/brands/offwhite/offwhite-typography-leather-wallet.jpg", "/img/brands/offwhite/offwhite-typography-leather-wallet.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃª Ä‘en in chá»¯ 'WALLET' trong dáº¥u ngoáº·c kÃ©p phong cÃ¡ch Virgil",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Off-White, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã / Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_offwhite_offwhite_typography_leather_wallet.Variants.Add(new ProductVariant { Sku = "OFF-WALL-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 8900000m, StockQuantity = 50 });
            allProducts.Add(prod_offwhite_offwhite_typography_leather_wallet);
            var prod_offwhite_offwhite_arthur_acetate_sunglasses = new Product
            {
                SellerId = seller_offwhite.Id,
                CategoryId = catAccessories.Id,
                Name = "KÃ­nh MÃ¡t Khung VuÃ´ng Arthur Acetate Sunglasses",
                Slug = "offwhite-offwhite-arthur-acetate-sunglasses",
                Sku = "OFF-SUNG-3",
                CollectionName = "Off-White Eyewear",
                Description = "KÃ­nh MÃ¡t Khung VuÃ´ng Arthur Acetate Sunglasses chÃ­nh hÃ£ng tá»« Off-White. Cháº¿ tÃ¡c tá»« Gá»ng acetate dÃ y Ä‘Ã­nh há»a tiáº¿t logo kim loáº¡i cáº¯t laser chÃ¬m vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 9800000m,
                OriginalPrice = 11200000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/offwhite/offwhite-arthur-acetate-sunglasses.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/offwhite/offwhite-arthur-acetate-sunglasses.jpg", "/img/brands/offwhite/offwhite-arthur-acetate-sunglasses.jpg", "/img/brands/offwhite/offwhite-arthur-acetate-sunglasses.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Gá»ng acetate dÃ y Ä‘Ã­nh há»a tiáº¿t logo kim loáº¡i cáº¯t laser chÃ¬m",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Off-White, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Ã / Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_offwhite_offwhite_arthur_acetate_sunglasses.Variants.Add(new ProductVariant { Sku = "OFF-SUNG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 9800000m, StockQuantity = 50 });
            allProducts.Add(prod_offwhite_offwhite_arthur_acetate_sunglasses);

            var seller_puma = dbUsers.First(u => u.Email == "puma@gmail.com");
            var prod_puma_puma_suede_classic_xxi = new Product
            {
                SellerId = seller_puma.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Puma Suede Classic XXI Low",
                Slug = "puma-puma-suede-classic-xxi",
                Sku = "PUM-XXI-1",
                CollectionName = "Puma Suede Heritage",
                Description = "GiÃ y Sneaker Puma Suede Classic XXI Low chÃ­nh hÃ£ng tá»« Puma. Cháº¿ tÃ¡c tá»« Da lá»™n cao cáº¥p Ãªm Ã¡i, dáº£i Formstrip viá»n da tráº¯ng cá»• Ä‘iá»ƒn vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2190000m,
                OriginalPrice = 2500000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/puma/puma-suede-classic-xxi.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/puma/puma-suede-classic-xxi.jpg", "/img/brands/puma/puma-suede-classic-xxi.jpg", "/img/brands/puma/puma-suede-classic-xxi.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da lá»™n cao cáº¥p Ãªm Ã¡i, dáº£i Formstrip viá»n da tráº¯ng cá»• Ä‘iá»ƒn",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Puma, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_puma_puma_suede_classic_xxi.Variants.Add(new ProductVariant { Sku = "PUM-XXI-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2190000m, StockQuantity = 15 });
            prod_puma_puma_suede_classic_xxi.Variants.Add(new ProductVariant { Sku = "PUM-XXI-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2190000m, StockQuantity = 20 });
            prod_puma_puma_suede_classic_xxi.Variants.Add(new ProductVariant { Sku = "PUM-XXI-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2190000m, StockQuantity = 15 });
            allProducts.Add(prod_puma_puma_suede_classic_xxi);
            var prod_puma_puma_speedcat_og_motorsport = new Product
            {
                SellerId = seller_puma.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Thá»ƒ Thao Puma Speedcat OG Motorsport",
                Slug = "puma-puma-speedcat-og-motorsport",
                Sku = "PUM-MOTO-1",
                CollectionName = "Puma Motorsport",
                Description = "GiÃ y Thá»ƒ Thao Puma Speedcat OG Motorsport chÃ­nh hÃ£ng tá»« Puma. Cháº¿ tÃ¡c tá»« Thiáº¿t káº¿ giÃ y Ä‘ua xe F1 da lá»™n Ã´m chÃ¢n siÃªu nháº¹ vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2890000m,
                OriginalPrice = 3300000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/puma/puma-speedcat-og-motorsport.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/puma/puma-speedcat-og-motorsport.jpg", "/img/brands/puma/puma-speedcat-og-motorsport.jpg", "/img/brands/puma/puma-speedcat-og-motorsport.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Thiáº¿t káº¿ giÃ y Ä‘ua xe F1 da lá»™n Ã´m chÃ¢n siÃªu nháº¹",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Puma, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_puma_puma_speedcat_og_motorsport.Variants.Add(new ProductVariant { Sku = "PUM-MOTO-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2890000m, StockQuantity = 15 });
            prod_puma_puma_speedcat_og_motorsport.Variants.Add(new ProductVariant { Sku = "PUM-MOTO-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2890000m, StockQuantity = 20 });
            prod_puma_puma_speedcat_og_motorsport.Variants.Add(new ProductVariant { Sku = "PUM-MOTO-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2890000m, StockQuantity = 15 });
            allProducts.Add(prod_puma_puma_speedcat_og_motorsport);
            var prod_puma_puma_palermo_leather_terrace = new Product
            {
                SellerId = seller_puma.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Puma Palermo Leather Terrace",
                Slug = "puma-puma-palermo-leather-terrace",
                Sku = "PUM-TERR-1",
                CollectionName = "Puma Terrace Collection",
                Description = "GiÃ y Sneaker Puma Palermo Leather Terrace chÃ­nh hÃ£ng tá»« Puma. Cháº¿ tÃ¡c tá»« Da trÆ¡n phá»‘i da lá»™n phong cÃ¡ch khÃ¡n Ä‘Ã i bÃ³ng Ä‘Ã¡ Ã 1980 vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2690000m,
                OriginalPrice = 3100000m,
                DiscountPercent = 13,
                ImageUrl = "/img/brands/puma/puma-palermo-leather-terrace.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/puma/puma-palermo-leather-terrace.jpg", "/img/brands/puma/puma-palermo-leather-terrace.jpg", "/img/brands/puma/puma-palermo-leather-terrace.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da trÆ¡n phá»‘i da lá»™n phong cÃ¡ch khÃ¡n Ä‘Ã i bÃ³ng Ä‘Ã¡ Ã 1980",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Puma, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_puma_puma_palermo_leather_terrace.Variants.Add(new ProductVariant { Sku = "PUM-TERR-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2690000m, StockQuantity = 15 });
            prod_puma_puma_palermo_leather_terrace.Variants.Add(new ProductVariant { Sku = "PUM-TERR-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2690000m, StockQuantity = 20 });
            prod_puma_puma_palermo_leather_terrace.Variants.Add(new ProductVariant { Sku = "PUM-TERR-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2690000m, StockQuantity = 15 });
            allProducts.Add(prod_puma_puma_palermo_leather_terrace);
            var prod_puma_puma_t7_track_jacket_heritage = new Product
            {
                SellerId = seller_puma.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c Thá»ƒ Thao Puma T7 Track Jacket Heritage",
                Slug = "puma-puma-t7-track-jacket-heritage",
                Sku = "PUM-HERI-2",
                CollectionName = "Puma T7 Heritage",
                Description = "Ão KhoÃ¡c Thá»ƒ Thao Puma T7 Track Jacket Heritage chÃ­nh hÃ£ng tá»« Puma. Cháº¿ tÃ¡c tá»« Dáº£i sá»c 7cm Ä‘áº·c trÆ°ng trÃªn vai Ã¡o, cháº¥t thun co giÃ£n thá»ƒ thao vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1950000m,
                OriginalPrice = 2300000m,
                DiscountPercent = 15,
                ImageUrl = "/img/brands/puma/puma-t7-track-jacket-heritage.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/puma/puma-t7-track-jacket-heritage.jpg", "/img/brands/puma/puma-t7-track-jacket-heritage.jpg", "/img/brands/puma/puma-t7-track-jacket-heritage.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Dáº£i sá»c 7cm Ä‘áº·c trÆ°ng trÃªn vai Ã¡o, cháº¥t thun co giÃ£n thá»ƒ thao",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Puma, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_puma_puma_t7_track_jacket_heritage.Variants.Add(new ProductVariant { Sku = "PUM-HERI-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 1950000m, StockQuantity = 15 });
            prod_puma_puma_t7_track_jacket_heritage.Variants.Add(new ProductVariant { Sku = "PUM-HERI-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1950000m, StockQuantity = 20 });
            prod_puma_puma_t7_track_jacket_heritage.Variants.Add(new ProductVariant { Sku = "PUM-HERI-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1950000m, StockQuantity = 15 });
            allProducts.Add(prod_puma_puma_t7_track_jacket_heritage);
            var prod_puma_puma_velocity_nitro_3_running = new Product
            {
                SellerId = seller_puma.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Cháº¡y Bá»™ Puma Velocity Nitro 3 Running",
                Slug = "puma-puma-velocity-nitro-3-running",
                Sku = "PUM-RUNN-1",
                CollectionName = "Puma Running Performance",
                Description = "GiÃ y Cháº¡y Bá»™ Puma Velocity Nitro 3 Running chÃ­nh hÃ£ng tá»« Puma. Cháº¿ tÃ¡c tá»« Bá»t Ä‘á»‡m khÃ­ NitÆ¡ NITROFOAM pháº£n há»“i lá»±c cá»±c nháº¡y vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 3890000m,
                OriginalPrice = 4400000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/puma/puma-velocity-nitro-3-running.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/puma/puma-velocity-nitro-3-running.jpg", "/img/brands/puma/puma-velocity-nitro-3-running.jpg", "/img/brands/puma/puma-velocity-nitro-3-running.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Bá»t Ä‘á»‡m khÃ­ NitÆ¡ NITROFOAM pháº£n há»“i lá»±c cá»±c nháº¡y",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Puma, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_puma_puma_velocity_nitro_3_running.Variants.Add(new ProductVariant { Sku = "PUM-RUNN-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 3890000m, StockQuantity = 15 });
            prod_puma_puma_velocity_nitro_3_running.Variants.Add(new ProductVariant { Sku = "PUM-RUNN-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 3890000m, StockQuantity = 20 });
            prod_puma_puma_velocity_nitro_3_running.Variants.Add(new ProductVariant { Sku = "PUM-RUNN-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 3890000m, StockQuantity = 15 });
            allProducts.Add(prod_puma_puma_velocity_nitro_3_running);
            var prod_puma_puma_fenty_creeper_phatty = new Product
            {
                SellerId = seller_puma.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Puma x Fenty Creeper Phatty By Rihanna",
                Slug = "puma-puma-fenty-creeper-phatty",
                Sku = "PUM-PHAT-1",
                CollectionName = "Puma x Fenty by Rihanna",
                Description = "GiÃ y Sneaker Puma x Fenty Creeper Phatty By Rihanna chÃ­nh hÃ£ng tá»« Puma. Cháº¿ tÃ¡c tá»« Äáº¿ káº¿p dÃ y chunky Ä‘á»‡m nhung da lá»™n thá»i trang Ä‘á»‰nh cao vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 3950000m,
                OriginalPrice = 4500000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/puma/puma-fenty-creeper-phatty.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/puma/puma-fenty-creeper-phatty.jpg", "/img/brands/puma/puma-fenty-creeper-phatty.jpg", "/img/brands/puma/puma-fenty-creeper-phatty.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Äáº¿ káº¿p dÃ y chunky Ä‘á»‡m nhung da lá»™n thá»i trang Ä‘á»‰nh cao",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Puma, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_puma_puma_fenty_creeper_phatty.Variants.Add(new ProductVariant { Sku = "PUM-PHAT-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 3950000m, StockQuantity = 15 });
            prod_puma_puma_fenty_creeper_phatty.Variants.Add(new ProductVariant { Sku = "PUM-PHAT-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 3950000m, StockQuantity = 20 });
            prod_puma_puma_fenty_creeper_phatty.Variants.Add(new ProductVariant { Sku = "PUM-PHAT-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 3950000m, StockQuantity = 15 });
            allProducts.Add(prod_puma_puma_fenty_creeper_phatty);
            var prod_puma_puma_core_heritage_backpack = new Product
            {
                SellerId = seller_puma.Id,
                CategoryId = catAccessories.Id,
                Name = "Balo Thá»i Trang Puma Core Heritage Backpack",
                Slug = "puma-puma-core-heritage-backpack",
                Sku = "PUM-BACK-3",
                CollectionName = "Puma Accessories",
                Description = "Balo Thá»i Trang Puma Core Heritage Backpack chÃ­nh hÃ£ng tá»« Puma. Cháº¿ tÃ¡c tá»« Váº£i dá»‡t chá»‘ng bÃ¡m bá»¥i, ngÄƒn Ä‘á»‡m laptop 15.6 inch chá»‘ng sá»‘c vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 790000m,
                OriginalPrice = 950000m,
                DiscountPercent = 17,
                ImageUrl = "/img/brands/puma/puma-core-heritage-backpack.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/puma/puma-core-heritage-backpack.jpg", "/img/brands/puma/puma-core-heritage-backpack.jpg", "/img/brands/puma/puma-core-heritage-backpack.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i dá»‡t chá»‘ng bÃ¡m bá»¥i, ngÄƒn Ä‘á»‡m laptop 15.6 inch chá»‘ng sá»‘c",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Puma, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_puma_puma_core_heritage_backpack.Variants.Add(new ProductVariant { Sku = "PUM-BACK-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 790000m, StockQuantity = 50 });
            allProducts.Add(prod_puma_puma_core_heritage_backpack);
            var prod_puma_puma_classics_relaxed_hoodie = new Product
            {
                SellerId = seller_puma.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão Ná»‰ CÃ³ MÅ© Puma Classics Relaxed Hoodie",
                Slug = "puma-puma-classics-relaxed-hoodie",
                Sku = "PUM-HOOD-2",
                CollectionName = "Puma Classics",
                Description = "Ão Ná»‰ CÃ³ MÅ© Puma Classics Relaxed Hoodie chÃ­nh hÃ£ng tá»« Puma. Cháº¿ tÃ¡c tá»« Cháº¥t ná»‰ bÃ´ng má»m máº¡i 100% bÃ´ng bá»n vá»¯ng Better Cotton vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1690000m,
                OriginalPrice = 1990000m,
                DiscountPercent = 15,
                ImageUrl = "/img/brands/puma/puma-classics-relaxed-hoodie.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/puma/puma-classics-relaxed-hoodie.jpg", "/img/brands/puma/puma-classics-relaxed-hoodie.jpg", "/img/brands/puma/puma-classics-relaxed-hoodie.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Cháº¥t ná»‰ bÃ´ng má»m máº¡i 100% bÃ´ng bá»n vá»¯ng Better Cotton",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Puma, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Äá»©c",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_puma_puma_classics_relaxed_hoodie.Variants.Add(new ProductVariant { Sku = "PUM-HOOD-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 1690000m, StockQuantity = 15 });
            prod_puma_puma_classics_relaxed_hoodie.Variants.Add(new ProductVariant { Sku = "PUM-HOOD-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1690000m, StockQuantity = 20 });
            prod_puma_puma_classics_relaxed_hoodie.Variants.Add(new ProductVariant { Sku = "PUM-HOOD-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1690000m, StockQuantity = 15 });
            allProducts.Add(prod_puma_puma_classics_relaxed_hoodie);

            var seller_zara = dbUsers.First(u => u.Email == "zara@gmail.com");
            var prod_zara_zara_tailored_double_breasted_blazer = new Product
            {
                SellerId = seller_zara.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão Blazer Ná»¯ Tailored Double-Breasted Wool Blend",
                Slug = "zara-zara-tailored-double-breasted-blazer",
                Sku = "ZAR-BLAZ-2",
                CollectionName = "Zara Woman Tailoring",
                Description = "Ão Blazer Ná»¯ Tailored Double-Breasted Wool Blend chÃ­nh hÃ£ng tá»« Zara. Cháº¿ tÃ¡c tá»« Váº£i len pha cao cáº¥p Ä‘á»©ng form, hai hÃ ng khuy kim loáº¡i sang trá»ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2690000m,
                OriginalPrice = 3100000m,
                DiscountPercent = 13,
                ImageUrl = "/img/brands/zara/zara-tailored-double-breasted-blazer.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/zara/zara-tailored-double-breasted-blazer.jpg", "/img/brands/zara/zara-tailored-double-breasted-blazer.jpg", "/img/brands/zara/zara-tailored-double-breasted-blazer.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i len pha cao cáº¥p Ä‘á»©ng form, hai hÃ ng khuy kim loáº¡i sang trá»ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Zara, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_zara_zara_tailored_double_breasted_blazer.Variants.Add(new ProductVariant { Sku = "ZAR-BLAZ-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 2690000m, StockQuantity = 15 });
            prod_zara_zara_tailored_double_breasted_blazer.Variants.Add(new ProductVariant { Sku = "ZAR-BLAZ-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 2690000m, StockQuantity = 20 });
            prod_zara_zara_tailored_double_breasted_blazer.Variants.Add(new ProductVariant { Sku = "ZAR-BLAZ-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 2690000m, StockQuantity = 15 });
            allProducts.Add(prod_zara_zara_tailored_double_breasted_blazer);
            var prod_zara_zara_minimalist_ribbed_knit_sweater = new Product
            {
                SellerId = seller_zara.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão Len Dá»‡t Kim Cá»• Cao Minimalist Ribbed Knit",
                Slug = "zara-zara-minimalist-ribbed-knit-sweater",
                Sku = "ZAR-SWEA-2",
                CollectionName = "Zara Knitwear",
                Description = "Ão Len Dá»‡t Kim Cá»• Cao Minimalist Ribbed Knit chÃ­nh hÃ£ng tá»« Zara. Cháº¿ tÃ¡c tá»« Sá»£i len dá»‡t gÃ¢n má»m máº¡i Ã´m dÃ¡ng, giá»¯ nhiá»‡t mÃ¹a Ä‘Ã´ng tá»‘i Æ°u vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1290000m,
                OriginalPrice = 1590000m,
                DiscountPercent = 19,
                ImageUrl = "/img/brands/zara/zara-minimalist-ribbed-knit-sweater.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/zara/zara-minimalist-ribbed-knit-sweater.jpg", "/img/brands/zara/zara-minimalist-ribbed-knit-sweater.jpg", "/img/brands/zara/zara-minimalist-ribbed-knit-sweater.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Sá»£i len dá»‡t gÃ¢n má»m máº¡i Ã´m dÃ¡ng, giá»¯ nhiá»‡t mÃ¹a Ä‘Ã´ng tá»‘i Æ°u",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Zara, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_zara_zara_minimalist_ribbed_knit_sweater.Variants.Add(new ProductVariant { Sku = "ZAR-SWEA-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 1290000m, StockQuantity = 15 });
            prod_zara_zara_minimalist_ribbed_knit_sweater.Variants.Add(new ProductVariant { Sku = "ZAR-SWEA-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1290000m, StockQuantity = 20 });
            prod_zara_zara_minimalist_ribbed_knit_sweater.Variants.Add(new ProductVariant { Sku = "ZAR-SWEA-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1290000m, StockQuantity = 15 });
            allProducts.Add(prod_zara_zara_minimalist_ribbed_knit_sweater);
            var prod_zara_zara_wide_leg_pleated_trousers = new Product
            {
                SellerId = seller_zara.Id,
                CategoryId = catStreetwear.Id,
                Name = "Quáº§n TÃ¢y á»ng Rá»™ng Xáº¿p Ly Wide-Leg Pleated Trousers",
                Slug = "zara-zara-wide-leg-pleated-trousers",
                Sku = "ZAR-TROU-2",
                CollectionName = "Zara Woman Studio",
                Description = "Quáº§n TÃ¢y á»ng Rá»™ng Xáº¿p Ly Wide-Leg Pleated Trousers chÃ­nh hÃ£ng tá»« Zara. Cháº¿ tÃ¡c tá»« Cáº¡p cao xáº¿p ly Ä‘Ã´i tÃ´n dÃ¡ng, cháº¥t váº£i rÅ© nháº¹ nhÃ ng thanh lá»‹ch vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1490000m,
                OriginalPrice = 1790000m,
                DiscountPercent = 17,
                ImageUrl = "/img/brands/zara/zara-wide-leg-pleated-trousers.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/zara/zara-wide-leg-pleated-trousers.jpg", "/img/brands/zara/zara-wide-leg-pleated-trousers.jpg", "/img/brands/zara/zara-wide-leg-pleated-trousers.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Cáº¡p cao xáº¿p ly Ä‘Ã´i tÃ´n dÃ¡ng, cháº¥t váº£i rÅ© nháº¹ nhÃ ng thanh lá»‹ch",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Zara, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_zara_zara_wide_leg_pleated_trousers.Variants.Add(new ProductVariant { Sku = "ZAR-TROU-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 1490000m, StockQuantity = 15 });
            prod_zara_zara_wide_leg_pleated_trousers.Variants.Add(new ProductVariant { Sku = "ZAR-TROU-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1490000m, StockQuantity = 20 });
            prod_zara_zara_wide_leg_pleated_trousers.Variants.Add(new ProductVariant { Sku = "ZAR-TROU-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1490000m, StockQuantity = 15 });
            allProducts.Add(prod_zara_zara_wide_leg_pleated_trousers);
            var prod_zara_zara_faux_leather_oversized_trench = new Product
            {
                SellerId = seller_zara.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão MÄƒng TÃ´ Da Faux Leather Oversized Trench Coat",
                Slug = "zara-zara-faux-leather-oversized-trench",
                Sku = "ZAR-TREN-2",
                CollectionName = "Zara Outerwear",
                Description = "Ão MÄƒng TÃ´ Da Faux Leather Oversized Trench Coat chÃ­nh hÃ£ng tá»« Zara. Cháº¿ tÃ¡c tá»« Da nhÃ¢n táº¡o má»m má»‹n chá»‘ng giÃ³, kÃ¨m tháº¯t lÆ°ng buá»™c eo cÃ¡ tÃ­nh vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 3290000m,
                OriginalPrice = 3800000m,
                DiscountPercent = 13,
                ImageUrl = "/img/brands/zara/zara-faux-leather-oversized-trench.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/zara/zara-faux-leather-oversized-trench.jpg", "/img/brands/zara/zara-faux-leather-oversized-trench.jpg", "/img/brands/zara/zara-faux-leather-oversized-trench.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da nhÃ¢n táº¡o má»m má»‹n chá»‘ng giÃ³, kÃ¨m tháº¯t lÆ°ng buá»™c eo cÃ¡ tÃ­nh",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Zara, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_zara_zara_faux_leather_oversized_trench.Variants.Add(new ProductVariant { Sku = "ZAR-TREN-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 3290000m, StockQuantity = 15 });
            prod_zara_zara_faux_leather_oversized_trench.Variants.Add(new ProductVariant { Sku = "ZAR-TREN-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 3290000m, StockQuantity = 20 });
            prod_zara_zara_faux_leather_oversized_trench.Variants.Add(new ProductVariant { Sku = "ZAR-TREN-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 3290000m, StockQuantity = 15 });
            allProducts.Add(prod_zara_zara_faux_leather_oversized_trench);
            var prod_zara_zara_pointed_toe_kitten_boots = new Product
            {
                SellerId = seller_zara.Id,
                CategoryId = catSneaker.Id,
                Name = "Bá»‘t Da MÅ©i Nhá»n Pointed Toe Kitten Heel Boots",
                Slug = "zara-zara-pointed-toe-kitten-boots",
                Sku = "ZAR-BOOT-1",
                CollectionName = "Zara Footwear",
                Description = "Bá»‘t Da MÅ©i Nhá»n Pointed Toe Kitten Heel Boots chÃ­nh hÃ£ng tá»« Zara. Cháº¿ tÃ¡c tá»« Da tháº­t má»m Ã´m báº¯p chÃ¢n, gÃ³t máº£nh 5cm thoáº£i mÃ¡i di chuyá»ƒn vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2190000m,
                OriginalPrice = 2590000m,
                DiscountPercent = 15,
                ImageUrl = "/img/brands/zara/zara-pointed-toe-kitten-boots.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/zara/zara-pointed-toe-kitten-boots.jpg", "/img/brands/zara/zara-pointed-toe-kitten-boots.jpg", "/img/brands/zara/zara-pointed-toe-kitten-boots.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da tháº­t má»m Ã´m báº¯p chÃ¢n, gÃ³t máº£nh 5cm thoáº£i mÃ¡i di chuyá»ƒn",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Zara, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_zara_zara_pointed_toe_kitten_boots.Variants.Add(new ProductVariant { Sku = "ZAR-BOOT-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2190000m, StockQuantity = 15 });
            prod_zara_zara_pointed_toe_kitten_boots.Variants.Add(new ProductVariant { Sku = "ZAR-BOOT-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2190000m, StockQuantity = 20 });
            prod_zara_zara_pointed_toe_kitten_boots.Variants.Add(new ProductVariant { Sku = "ZAR-BOOT-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2190000m, StockQuantity = 15 });
            allProducts.Add(prod_zara_zara_pointed_toe_kitten_boots);
            var prod_zara_zara_textured_leather_city_bag = new Product
            {
                SellerId = seller_zara.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi XÃ¡ch Da Äeo ChÃ©o Textured Leather City Bag",
                Slug = "zara-zara-textured-leather-city-bag",
                Sku = "ZAR-BAG-3",
                CollectionName = "Zara Leather Bags",
                Description = "TÃºi XÃ¡ch Da Äeo ChÃ©o Textured Leather City Bag chÃ­nh hÃ£ng tá»« Zara. Cháº¿ tÃ¡c tá»« Da bÃ² dáº­p vÃ¢n tá»± nhiÃªn, nhiá»u ngÄƒn Ä‘á»±ng Ä‘á»“ tiá»‡n dá»¥ng vÄƒn phÃ²ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1990000m,
                OriginalPrice = 2390000m,
                DiscountPercent = 17,
                ImageUrl = "/img/brands/zara/zara-textured-leather-city-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/zara/zara-textured-leather-city-bag.jpg", "/img/brands/zara/zara-textured-leather-city-bag.jpg", "/img/brands/zara/zara-textured-leather-city-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² dáº­p vÃ¢n tá»± nhiÃªn, nhiá»u ngÄƒn Ä‘á»±ng Ä‘á»“ tiá»‡n dá»¥ng vÄƒn phÃ²ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Zara, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_zara_zara_textured_leather_city_bag.Variants.Add(new ProductVariant { Sku = "ZAR-BAG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 1990000m, StockQuantity = 50 });
            allProducts.Add(prod_zara_zara_textured_leather_city_bag);
            var prod_zara_zara_basic_relaxed_poplin_shirt = new Product
            {
                SellerId = seller_zara.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão SÆ¡ Mi Poplin Cotton DÃ¡ng Rá»™ng Basic Relaxed",
                Slug = "zara-zara-basic-relaxed-poplin-shirt",
                Sku = "ZAR-SHIR-2",
                CollectionName = "Zara Essentials",
                Description = "Ão SÆ¡ Mi Poplin Cotton DÃ¡ng Rá»™ng Basic Relaxed chÃ­nh hÃ£ng tá»« Zara. Cháº¿ tÃ¡c tá»« 100% Cotton Poplin cao cáº¥p tháº¥m hÃºt tá»‘t, cÃºc vá» á»‘c tinh xáº£o vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 990000m,
                OriginalPrice = 1190000m,
                DiscountPercent = 17,
                ImageUrl = "/img/brands/zara/zara-basic-relaxed-poplin-shirt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/zara/zara-basic-relaxed-poplin-shirt.jpg", "/img/brands/zara/zara-basic-relaxed-poplin-shirt.jpg", "/img/brands/zara/zara-basic-relaxed-poplin-shirt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "100% Cotton Poplin cao cáº¥p tháº¥m hÃºt tá»‘t, cÃºc vá» á»‘c tinh xáº£o",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Zara, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_zara_zara_basic_relaxed_poplin_shirt.Variants.Add(new ProductVariant { Sku = "ZAR-SHIR-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 990000m, StockQuantity = 15 });
            prod_zara_zara_basic_relaxed_poplin_shirt.Variants.Add(new ProductVariant { Sku = "ZAR-SHIR-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 990000m, StockQuantity = 20 });
            prod_zara_zara_basic_relaxed_poplin_shirt.Variants.Add(new ProductVariant { Sku = "ZAR-SHIR-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 990000m, StockQuantity = 15 });
            allProducts.Add(prod_zara_zara_basic_relaxed_poplin_shirt);
            var prod_zara_zara_belted_linen_blend_jumpsuit = new Product
            {
                SellerId = seller_zara.Id,
                CategoryId = catStreetwear.Id,
                Name = "Bá»™ Jumpsuit Linen Pha Äai Eo Belted Jumpsuit",
                Slug = "zara-zara-belted-linen-blend-jumpsuit",
                Sku = "ZAR-JUMP-2",
                CollectionName = "Zara Summer Edition",
                Description = "Bá»™ Jumpsuit Linen Pha Äai Eo Belted Jumpsuit chÃ­nh hÃ£ng tá»« Zara. Cháº¿ tÃ¡c tá»« Váº£i Ä‘Å©i Linen thoÃ¡ng khÃ­ mÃ¹a hÃ¨, Ä‘ai tháº¯t táº¡o Ä‘iá»ƒm nháº¥n eo vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1890000m,
                OriginalPrice = 2290000m,
                DiscountPercent = 17,
                ImageUrl = "/img/brands/zara/zara-belted-linen-blend-jumpsuit.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/zara/zara-belted-linen-blend-jumpsuit.jpg", "/img/brands/zara/zara-belted-linen-blend-jumpsuit.jpg", "/img/brands/zara/zara-belted-linen-blend-jumpsuit.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i Ä‘Å©i Linen thoÃ¡ng khÃ­ mÃ¹a hÃ¨, Ä‘ai tháº¯t táº¡o Ä‘iá»ƒm nháº¥n eo",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Zara, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "TÃ¢y Ban Nha",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_zara_zara_belted_linen_blend_jumpsuit.Variants.Add(new ProductVariant { Sku = "ZAR-JUMP-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 1890000m, StockQuantity = 15 });
            prod_zara_zara_belted_linen_blend_jumpsuit.Variants.Add(new ProductVariant { Sku = "ZAR-JUMP-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1890000m, StockQuantity = 20 });
            prod_zara_zara_belted_linen_blend_jumpsuit.Variants.Add(new ProductVariant { Sku = "ZAR-JUMP-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1890000m, StockQuantity = 15 });
            allProducts.Add(prod_zara_zara_belted_linen_blend_jumpsuit);

            var seller_uniqlo = dbUsers.First(u => u.Email == "uniqlo@gmail.com");
            var prod_uniqlo_uniqlo_ultra_light_down_jacket = new Product
            {
                SellerId = seller_uniqlo.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão Phao LÃ´ng VÅ© SiÃªu Nháº¹ Ultra Light Down Jacket",
                Slug = "uniqlo-uniqlo-ultra-light-down-jacket",
                Sku = "UNI-JACK-2",
                CollectionName = "Uniqlo LifeWear Icon",
                Description = "Ão Phao LÃ´ng VÅ© SiÃªu Nháº¹ Ultra Light Down Jacket chÃ­nh hÃ£ng tá»« Uniqlo. Cháº¿ tÃ¡c tá»« LÃ´ng vÅ© 750+ fill power siÃªu áº¥m, cÃ³ thá»ƒ gáº¥p gá»n trong tÃºi nhá» vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1790000m,
                OriginalPrice = 1990000m,
                DiscountPercent = 10,
                ImageUrl = "/img/brands/uniqlo/uniqlo-ultra-light-down-jacket.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/uniqlo/uniqlo-ultra-light-down-jacket.jpg", "/img/brands/uniqlo/uniqlo-ultra-light-down-jacket.jpg", "/img/brands/uniqlo/uniqlo-ultra-light-down-jacket.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "LÃ´ng vÅ© 750+ fill power siÃªu áº¥m, cÃ³ thá»ƒ gáº¥p gá»n trong tÃºi nhá»",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Uniqlo, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Nháº­t Báº£n",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_uniqlo_uniqlo_ultra_light_down_jacket.Variants.Add(new ProductVariant { Sku = "UNI-JACK-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 1790000m, StockQuantity = 15 });
            prod_uniqlo_uniqlo_ultra_light_down_jacket.Variants.Add(new ProductVariant { Sku = "UNI-JACK-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1790000m, StockQuantity = 20 });
            prod_uniqlo_uniqlo_ultra_light_down_jacket.Variants.Add(new ProductVariant { Sku = "UNI-JACK-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1790000m, StockQuantity = 15 });
            allProducts.Add(prod_uniqlo_uniqlo_ultra_light_down_jacket);
            var prod_uniqlo_uniqlo_airism_cotton_oversize_tee = new Product
            {
                SellerId = seller_uniqlo.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão PhÃ´ng Cá»• TrÃ²n AIRism Cotton Oversized Tee",
                Slug = "uniqlo-uniqlo-airism-cotton-oversize-tee",
                Sku = "UNI-TEE-2",
                CollectionName = "Uniqlo AIRism Series",
                Description = "Ão PhÃ´ng Cá»• TrÃ²n AIRism Cotton Oversized Tee chÃ­nh hÃ£ng tá»« Uniqlo. Cháº¿ tÃ¡c tá»« CÃ´ng nghá»‡ AIRism mÃ¡t láº¡nh máº·t trong, máº·t ngoÃ i cotton dá»‡t má»‹n vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 390000m,
                OriginalPrice = 490000m,
                DiscountPercent = 20,
                ImageUrl = "/img/brands/uniqlo/uniqlo-airism-cotton-oversize-tee.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/uniqlo/uniqlo-airism-cotton-oversize-tee.jpg", "/img/brands/uniqlo/uniqlo-airism-cotton-oversize-tee.jpg", "/img/brands/uniqlo/uniqlo-airism-cotton-oversize-tee.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "CÃ´ng nghá»‡ AIRism mÃ¡t láº¡nh máº·t trong, máº·t ngoÃ i cotton dá»‡t má»‹n",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Uniqlo, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Nháº­t Báº£n",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_uniqlo_uniqlo_airism_cotton_oversize_tee.Variants.Add(new ProductVariant { Sku = "UNI-TEE-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 390000m, StockQuantity = 15 });
            prod_uniqlo_uniqlo_airism_cotton_oversize_tee.Variants.Add(new ProductVariant { Sku = "UNI-TEE-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 390000m, StockQuantity = 20 });
            prod_uniqlo_uniqlo_airism_cotton_oversize_tee.Variants.Add(new ProductVariant { Sku = "UNI-TEE-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 390000m, StockQuantity = 15 });
            allProducts.Add(prod_uniqlo_uniqlo_airism_cotton_oversize_tee);
            var prod_uniqlo_uniqlo_extra_fine_merino_cardigan = new Product
            {
                SellerId = seller_uniqlo.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão Cardigan Len LÃ´ng Cá»«u Extra Fine Merino Wool",
                Slug = "uniqlo-uniqlo-extra-fine-merino-cardigan",
                Sku = "UNI-CARD-2",
                CollectionName = "Uniqlo Merino Wool",
                Description = "Ão Cardigan Len LÃ´ng Cá»«u Extra Fine Merino Wool chÃ­nh hÃ£ng tá»« Uniqlo. Cháº¿ tÃ¡c tá»« 100% Len Merino 19.5 micron cÃ³ thá»ƒ giáº·t mÃ¡y mÃ  khÃ´ng xÆ¡ rá»‘i vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 990000m,
                OriginalPrice = 1190000m,
                DiscountPercent = 17,
                ImageUrl = "/img/brands/uniqlo/uniqlo-extra-fine-merino-cardigan.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/uniqlo/uniqlo-extra-fine-merino-cardigan.jpg", "/img/brands/uniqlo/uniqlo-extra-fine-merino-cardigan.jpg", "/img/brands/uniqlo/uniqlo-extra-fine-merino-cardigan.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "100% Len Merino 19.5 micron cÃ³ thá»ƒ giáº·t mÃ¡y mÃ  khÃ´ng xÆ¡ rá»‘i",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Uniqlo, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Nháº­t Báº£n",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_uniqlo_uniqlo_extra_fine_merino_cardigan.Variants.Add(new ProductVariant { Sku = "UNI-CARD-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 990000m, StockQuantity = 15 });
            prod_uniqlo_uniqlo_extra_fine_merino_cardigan.Variants.Add(new ProductVariant { Sku = "UNI-CARD-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 990000m, StockQuantity = 20 });
            prod_uniqlo_uniqlo_extra_fine_merino_cardigan.Variants.Add(new ProductVariant { Sku = "UNI-CARD-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 990000m, StockQuantity = 15 });
            allProducts.Add(prod_uniqlo_uniqlo_extra_fine_merino_cardigan);
            var prod_uniqlo_uniqlo_smart_stretch_ankle_pants = new Product
            {
                SellerId = seller_uniqlo.Id,
                CategoryId = catStreetwear.Id,
                Name = "Quáº§n DÃ i Co GiÃ£n 2 Chiá»u Smart Ankle Pants",
                Slug = "uniqlo-uniqlo-smart-stretch-ankle-pants",
                Sku = "UNI-PANT-2",
                CollectionName = "Uniqlo Smart Pants",
                Description = "Quáº§n DÃ i Co GiÃ£n 2 Chiá»u Smart Ankle Pants chÃ­nh hÃ£ng tá»« Uniqlo. Cháº¿ tÃ¡c tá»« Váº£i chá»‘ng nhÄƒn co giÃ£n nháº¹, chiá»u dÃ i cháº¡m máº¯t cÃ¡ chuáº©n cÃ´ng sá»Ÿ vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 790000m,
                OriginalPrice = 990000m,
                DiscountPercent = 20,
                ImageUrl = "/img/brands/uniqlo/uniqlo-smart-stretch-ankle-pants.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/uniqlo/uniqlo-smart-stretch-ankle-pants.jpg", "/img/brands/uniqlo/uniqlo-smart-stretch-ankle-pants.jpg", "/img/brands/uniqlo/uniqlo-smart-stretch-ankle-pants.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i chá»‘ng nhÄƒn co giÃ£n nháº¹, chiá»u dÃ i cháº¡m máº¯t cÃ¡ chuáº©n cÃ´ng sá»Ÿ",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Uniqlo, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Nháº­t Báº£n",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_uniqlo_uniqlo_smart_stretch_ankle_pants.Variants.Add(new ProductVariant { Sku = "UNI-PANT-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 790000m, StockQuantity = 15 });
            prod_uniqlo_uniqlo_smart_stretch_ankle_pants.Variants.Add(new ProductVariant { Sku = "UNI-PANT-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 790000m, StockQuantity = 20 });
            prod_uniqlo_uniqlo_smart_stretch_ankle_pants.Variants.Add(new ProductVariant { Sku = "UNI-PANT-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 790000m, StockQuantity = 15 });
            allProducts.Add(prod_uniqlo_uniqlo_smart_stretch_ankle_pants);
            var prod_uniqlo_uniqlo_seamless_down_hooded_parka = new Product
            {
                SellerId = seller_uniqlo.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c Parka Liá»n MÅ© Seamless Down Parka",
                Slug = "uniqlo-uniqlo-seamless-down-hooded-parka",
                Sku = "UNI-PARK-2",
                CollectionName = "Uniqlo Seamless Down",
                Description = "Ão KhoÃ¡c Parka Liá»n MÅ© Seamless Down Parka chÃ­nh hÃ£ng tá»« Uniqlo. Cháº¿ tÃ¡c tá»« Thiáº¿t káº¿ khÃ´ng Ä‘Æ°á»ng may chá»‘ng giÃ³ lÃ¹a vÃ  chá»‘ng tháº¥m nÆ°á»›c mÆ°a vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2990000m,
                OriginalPrice = 3400000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/uniqlo/uniqlo-seamless-down-hooded-parka.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/uniqlo/uniqlo-seamless-down-hooded-parka.jpg", "/img/brands/uniqlo/uniqlo-seamless-down-hooded-parka.jpg", "/img/brands/uniqlo/uniqlo-seamless-down-hooded-parka.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Thiáº¿t káº¿ khÃ´ng Ä‘Æ°á»ng may chá»‘ng giÃ³ lÃ¹a vÃ  chá»‘ng tháº¥m nÆ°á»›c mÆ°a",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Uniqlo, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Nháº­t Báº£n",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_uniqlo_uniqlo_seamless_down_hooded_parka.Variants.Add(new ProductVariant { Sku = "UNI-PARK-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 2990000m, StockQuantity = 15 });
            prod_uniqlo_uniqlo_seamless_down_hooded_parka.Variants.Add(new ProductVariant { Sku = "UNI-PARK-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 2990000m, StockQuantity = 20 });
            prod_uniqlo_uniqlo_seamless_down_hooded_parka.Variants.Add(new ProductVariant { Sku = "UNI-PARK-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 2990000m, StockQuantity = 15 });
            allProducts.Add(prod_uniqlo_uniqlo_seamless_down_hooded_parka);
            var prod_uniqlo_uniqlo_premium_lambswool_sweater = new Product
            {
                SellerId = seller_uniqlo.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão Len Cá»• TrÃ²n Dá»‡t Kim Premium Lambswool",
                Slug = "uniqlo-uniqlo-premium-lambswool-sweater",
                Sku = "UNI-SWEA-2",
                CollectionName = "Uniqlo Knitwear",
                Description = "Ão Len Cá»• TrÃ²n Dá»‡t Kim Premium Lambswool chÃ­nh hÃ£ng tá»« Uniqlo. Cháº¿ tÃ¡c tá»« 100% Len cá»«u non cao cáº¥p tá»« trang tráº¡i Ä‘áº¡t chuáº©n nhÃ¢n Ä‘áº¡o vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 790000m,
                OriginalPrice = 950000m,
                DiscountPercent = 17,
                ImageUrl = "/img/brands/uniqlo/uniqlo-premium-lambswool-sweater.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/uniqlo/uniqlo-premium-lambswool-sweater.jpg", "/img/brands/uniqlo/uniqlo-premium-lambswool-sweater.jpg", "/img/brands/uniqlo/uniqlo-premium-lambswool-sweater.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "100% Len cá»«u non cao cáº¥p tá»« trang tráº¡i Ä‘áº¡t chuáº©n nhÃ¢n Ä‘áº¡o",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Uniqlo, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Nháº­t Báº£n",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_uniqlo_uniqlo_premium_lambswool_sweater.Variants.Add(new ProductVariant { Sku = "UNI-SWEA-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 790000m, StockQuantity = 15 });
            prod_uniqlo_uniqlo_premium_lambswool_sweater.Variants.Add(new ProductVariant { Sku = "UNI-SWEA-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 790000m, StockQuantity = 20 });
            prod_uniqlo_uniqlo_premium_lambswool_sweater.Variants.Add(new ProductVariant { Sku = "UNI-SWEA-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 790000m, StockQuantity = 15 });
            allProducts.Add(prod_uniqlo_uniqlo_premium_lambswool_sweater);
            var prod_uniqlo_uniqlo_round_mini_shoulder_bag = new Product
            {
                SellerId = seller_uniqlo.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi Äeo ChÃ©o BÃ¡n Nguyá»‡t Round Mini Shoulder Bag",
                Slug = "uniqlo-uniqlo-round-mini-shoulder-bag",
                Sku = "UNI-BAG-3",
                CollectionName = "Uniqlo Accessories",
                Description = "TÃºi Äeo ChÃ©o BÃ¡n Nguyá»‡t Round Mini Shoulder Bag chÃ­nh hÃ£ng tá»« Uniqlo. Cháº¿ tÃ¡c tá»« Thiáº¿t káº¿ bÃ¡n nguyá»‡t chá»©a Ä‘á»“ tháº§n ká»³ chá»‘ng nÆ°á»›c nháº¹ nháº¹ tÃªnh vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 390000m,
                OriginalPrice = 490000m,
                DiscountPercent = 20,
                ImageUrl = "/img/brands/uniqlo/uniqlo-round-mini-shoulder-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/uniqlo/uniqlo-round-mini-shoulder-bag.jpg", "/img/brands/uniqlo/uniqlo-round-mini-shoulder-bag.jpg", "/img/brands/uniqlo/uniqlo-round-mini-shoulder-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Thiáº¿t káº¿ bÃ¡n nguyá»‡t chá»©a Ä‘á»“ tháº§n ká»³ chá»‘ng nÆ°á»›c nháº¹ nháº¹ tÃªnh",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Uniqlo, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Nháº­t Báº£n",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_uniqlo_uniqlo_round_mini_shoulder_bag.Variants.Add(new ProductVariant { Sku = "UNI-BAG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 390000m, StockQuantity = 50 });
            allProducts.Add(prod_uniqlo_uniqlo_round_mini_shoulder_bag);
            var prod_uniqlo_uniqlo_dry_ex_functional_tee = new Product
            {
                SellerId = seller_uniqlo.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão Thá»ƒ Thao Dry-EX ThoÃ¡t áº¨m Nhanh Functional Tee",
                Slug = "uniqlo-uniqlo-dry-ex-functional-tee",
                Sku = "UNI-TEE-3",
                CollectionName = "Uniqlo DRY-EX Sport",
                Description = "Ão Thá»ƒ Thao Dry-EX ThoÃ¡t áº¨m Nhanh Functional Tee chÃ­nh hÃ£ng tá»« Uniqlo. Cháº¿ tÃ¡c tá»« Sá»£i microfiber thoÃ¡t má»“ hÃ´i siÃªu tá»‘c Ä‘Æ°á»£c cÃ¡c VÄV tin dÃ¹ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 390000m,
                OriginalPrice = 490000m,
                DiscountPercent = 20,
                ImageUrl = "/img/brands/uniqlo/uniqlo-dry-ex-functional-tee.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/uniqlo/uniqlo-dry-ex-functional-tee.jpg", "/img/brands/uniqlo/uniqlo-dry-ex-functional-tee.jpg", "/img/brands/uniqlo/uniqlo-dry-ex-functional-tee.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Sá»£i microfiber thoÃ¡t má»“ hÃ´i siÃªu tá»‘c Ä‘Æ°á»£c cÃ¡c VÄV tin dÃ¹ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Uniqlo, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Nháº­t Báº£n",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_uniqlo_uniqlo_dry_ex_functional_tee.Variants.Add(new ProductVariant { Sku = "UNI-TEE-3-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 390000m, StockQuantity = 15 });
            prod_uniqlo_uniqlo_dry_ex_functional_tee.Variants.Add(new ProductVariant { Sku = "UNI-TEE-3-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 390000m, StockQuantity = 20 });
            prod_uniqlo_uniqlo_dry_ex_functional_tee.Variants.Add(new ProductVariant { Sku = "UNI-TEE-3-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 390000m, StockQuantity = 15 });
            allProducts.Add(prod_uniqlo_uniqlo_dry_ex_functional_tee);

            var seller_calvinklein = dbUsers.First(u => u.Email == "calvinklein@gmail.com");
            var prod_calvinklein_calvinklein_modern_cotton_bralette = new Product
            {
                SellerId = seller_calvinklein.Id,
                CategoryId = catStreetwear.Id,
                Name = "Set Ão LÃ³t Bralette KhÃ´ng Gá»ng Modern Cotton",
                Slug = "calvinklein-calvinklein-modern-cotton-bralette",
                Sku = "CAL-BRAL-2",
                CollectionName = "CK Modern Cotton",
                Description = "Set Ão LÃ³t Bralette KhÃ´ng Gá»ng Modern Cotton chÃ­nh hÃ£ng tá»« Calvin Klein. Cháº¿ tÃ¡c tá»« Cháº¥t cotton modal siÃªu co giÃ£n thoÃ¡ng mÃ¡t, Ä‘ai chun logo CK vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1450000m,
                OriginalPrice = 1690000m,
                DiscountPercent = 14,
                ImageUrl = "/img/brands/calvinklein/calvinklein-modern-cotton-bralette.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/calvinklein/calvinklein-modern-cotton-bralette.jpg", "/img/brands/calvinklein/calvinklein-modern-cotton-bralette.jpg", "/img/brands/calvinklein/calvinklein-modern-cotton-bralette.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Cháº¥t cotton modal siÃªu co giÃ£n thoÃ¡ng mÃ¡t, Ä‘ai chun logo CK",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Calvin Klein, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_calvinklein_calvinklein_modern_cotton_bralette.Variants.Add(new ProductVariant { Sku = "CAL-BRAL-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 1450000m, StockQuantity = 15 });
            prod_calvinklein_calvinklein_modern_cotton_bralette.Variants.Add(new ProductVariant { Sku = "CAL-BRAL-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1450000m, StockQuantity = 20 });
            prod_calvinklein_calvinklein_modern_cotton_bralette.Variants.Add(new ProductVariant { Sku = "CAL-BRAL-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1450000m, StockQuantity = 15 });
            allProducts.Add(prod_calvinklein_calvinklein_modern_cotton_bralette);
            var prod_calvinklein_calvinklein_90s_straight_denim_jeans = new Product
            {
                SellerId = seller_calvinklein.Id,
                CategoryId = catStreetwear.Id,
                Name = "Quáº§n Jeans á»ng SuÃ´ng 90s Straight Fit Selvedge",
                Slug = "calvinklein-calvinklein-90s-straight-denim-jeans",
                Sku = "CAL-JEAN-2",
                CollectionName = "CK Jeans Heritage",
                Description = "Quáº§n Jeans á»ng SuÃ´ng 90s Straight Fit Selvedge chÃ­nh hÃ£ng tá»« Calvin Klein. Cháº¿ tÃ¡c tá»« Denim cotton nguyÃªn báº£n dá»‡t biÃªn phong cÃ¡ch tháº­p niÃªn 90 vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 3850000m,
                OriginalPrice = 4400000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/calvinklein/calvinklein-90s-straight-denim-jeans.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/calvinklein/calvinklein-90s-straight-denim-jeans.jpg", "/img/brands/calvinklein/calvinklein-90s-straight-denim-jeans.jpg", "/img/brands/calvinklein/calvinklein-90s-straight-denim-jeans.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Denim cotton nguyÃªn báº£n dá»‡t biÃªn phong cÃ¡ch tháº­p niÃªn 90",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Calvin Klein, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_calvinklein_calvinklein_90s_straight_denim_jeans.Variants.Add(new ProductVariant { Sku = "CAL-JEAN-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 3850000m, StockQuantity = 15 });
            prod_calvinklein_calvinklein_90s_straight_denim_jeans.Variants.Add(new ProductVariant { Sku = "CAL-JEAN-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 3850000m, StockQuantity = 20 });
            prod_calvinklein_calvinklein_90s_straight_denim_jeans.Variants.Add(new ProductVariant { Sku = "CAL-JEAN-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 3850000m, StockQuantity = 15 });
            allProducts.Add(prod_calvinklein_calvinklein_90s_straight_denim_jeans);
            var prod_calvinklein_calvinklein_monogram_logo_tee = new Product
            {
                SellerId = seller_calvinklein.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão PhÃ´ng Monogram Logo Crewneck Tee Cotton",
                Slug = "calvinklein-calvinklein-monogram-logo-tee",
                Sku = "CAL-TEE-2",
                CollectionName = "CK Monogram Tees",
                Description = "Ão PhÃ´ng Monogram Logo Crewneck Tee Cotton chÃ­nh hÃ£ng tá»« Calvin Klein. Cháº¿ tÃ¡c tá»« 100% Cotton há»¯u cÆ¡ má»m máº¡i in logo cK Monogram ngá»±c Ã¡o vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1250000m,
                OriginalPrice = 1490000m,
                DiscountPercent = 16,
                ImageUrl = "/img/brands/calvinklein/calvinklein-monogram-logo-tee.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/calvinklein/calvinklein-monogram-logo-tee.jpg", "/img/brands/calvinklein/calvinklein-monogram-logo-tee.jpg", "/img/brands/calvinklein/calvinklein-monogram-logo-tee.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "100% Cotton há»¯u cÆ¡ má»m máº¡i in logo cK Monogram ngá»±c Ã¡o",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Calvin Klein, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_calvinklein_calvinklein_monogram_logo_tee.Variants.Add(new ProductVariant { Sku = "CAL-TEE-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 1250000m, StockQuantity = 15 });
            prod_calvinklein_calvinklein_monogram_logo_tee.Variants.Add(new ProductVariant { Sku = "CAL-TEE-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1250000m, StockQuantity = 20 });
            prod_calvinklein_calvinklein_monogram_logo_tee.Variants.Add(new ProductVariant { Sku = "CAL-TEE-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1250000m, StockQuantity = 15 });
            allProducts.Add(prod_calvinklein_calvinklein_monogram_logo_tee);
            var prod_calvinklein_calvinklein_trucker_sherpa_jacket = new Product
            {
                SellerId = seller_calvinklein.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c BÃ² LÃ³t LÃ´ng Cá»«u Denim Trucker Sherpa Jacket",
                Slug = "calvinklein-calvinklein-trucker-sherpa-jacket",
                Sku = "CAL-JACK-2",
                CollectionName = "CK Outerwear",
                Description = "Ão KhoÃ¡c BÃ² LÃ³t LÃ´ng Cá»«u Denim Trucker Sherpa Jacket chÃ­nh hÃ£ng tá»« Calvin Klein. Cháº¿ tÃ¡c tá»« Váº£i denim wash dÃ y dáº·n lÃ³t bÃ´ng Sherpa áº¥m Ã¡p mÃ¹a Ä‘Ã´ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 4950000m,
                OriginalPrice = 5600000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/calvinklein/calvinklein-trucker-sherpa-jacket.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/calvinklein/calvinklein-trucker-sherpa-jacket.jpg", "/img/brands/calvinklein/calvinklein-trucker-sherpa-jacket.jpg", "/img/brands/calvinklein/calvinklein-trucker-sherpa-jacket.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i denim wash dÃ y dáº·n lÃ³t bÃ´ng Sherpa áº¥m Ã¡p mÃ¹a Ä‘Ã´ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Calvin Klein, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_calvinklein_calvinklein_trucker_sherpa_jacket.Variants.Add(new ProductVariant { Sku = "CAL-JACK-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 4950000m, StockQuantity = 15 });
            prod_calvinklein_calvinklein_trucker_sherpa_jacket.Variants.Add(new ProductVariant { Sku = "CAL-JACK-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 4950000m, StockQuantity = 20 });
            prod_calvinklein_calvinklein_trucker_sherpa_jacket.Variants.Add(new ProductVariant { Sku = "CAL-JACK-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 4950000m, StockQuantity = 15 });
            allProducts.Add(prod_calvinklein_calvinklein_trucker_sherpa_jacket);
            var prod_calvinklein_calvinklein_low_rise_trunk_3pack = new Product
            {
                SellerId = seller_calvinklein.Id,
                CategoryId = catStreetwear.Id,
                Name = "Há»™p 3 Quáº§n LÃ³t Nam Low-Rise Trunk Microfiber",
                Slug = "calvinklein-calvinklein-low-rise-trunk-3pack",
                Sku = "CAL-3PAC-2",
                CollectionName = "CK Underwear Pack",
                Description = "Há»™p 3 Quáº§n LÃ³t Nam Low-Rise Trunk Microfiber chÃ­nh hÃ£ng tá»« Calvin Klein. Cháº¿ tÃ¡c tá»« Sá»£i Microfiber mÃ¡t láº¡nh co giÃ£n 4 chiá»u khÃ¡ng khuáº©n tá»‘i Æ°u vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1650000m,
                OriginalPrice = 1950000m,
                DiscountPercent = 15,
                ImageUrl = "/img/brands/calvinklein/calvinklein-low-rise-trunk-3pack.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/calvinklein/calvinklein-low-rise-trunk-3pack.jpg", "/img/brands/calvinklein/calvinklein-low-rise-trunk-3pack.jpg", "/img/brands/calvinklein/calvinklein-low-rise-trunk-3pack.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Sá»£i Microfiber mÃ¡t láº¡nh co giÃ£n 4 chiá»u khÃ¡ng khuáº©n tá»‘i Æ°u",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Calvin Klein, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_calvinklein_calvinklein_low_rise_trunk_3pack.Variants.Add(new ProductVariant { Sku = "CAL-3PAC-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 1650000m, StockQuantity = 15 });
            prod_calvinklein_calvinklein_low_rise_trunk_3pack.Variants.Add(new ProductVariant { Sku = "CAL-3PAC-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 1650000m, StockQuantity = 20 });
            prod_calvinklein_calvinklein_low_rise_trunk_3pack.Variants.Add(new ProductVariant { Sku = "CAL-3PAC-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 1650000m, StockQuantity = 15 });
            allProducts.Add(prod_calvinklein_calvinklein_low_rise_trunk_3pack);
            var prod_calvinklein_calvinklein_reversible_leather_belt = new Product
            {
                SellerId = seller_calvinklein.Id,
                CategoryId = catAccessories.Id,
                Name = "Tháº¯t LÆ°ng Da Nam Reversible Leather Plaque Belt",
                Slug = "calvinklein-calvinklein-reversible-leather-belt",
                Sku = "CAL-BELT-3",
                CollectionName = "CK Leather Goods",
                Description = "Tháº¯t LÆ°ng Da Nam Reversible Leather Plaque Belt chÃ­nh hÃ£ng tá»« Calvin Klein. Cháº¿ tÃ¡c tá»« Da bÃ² trÆ¡n 2 máº·t Ä‘en vÃ  nÃ¢u, máº·t khÃ³a há»£p kim xoay tiá»‡n lá»£i vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1850000m,
                OriginalPrice = 2190000m,
                DiscountPercent = 16,
                ImageUrl = "/img/brands/calvinklein/calvinklein-reversible-leather-belt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/calvinklein/calvinklein-reversible-leather-belt.jpg", "/img/brands/calvinklein/calvinklein-reversible-leather-belt.jpg", "/img/brands/calvinklein/calvinklein-reversible-leather-belt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² trÆ¡n 2 máº·t Ä‘en vÃ  nÃ¢u, máº·t khÃ³a há»£p kim xoay tiá»‡n lá»£i",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Calvin Klein, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_calvinklein_calvinklein_reversible_leather_belt.Variants.Add(new ProductVariant { Sku = "CAL-BELT-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 1850000m, StockQuantity = 50 });
            allProducts.Add(prod_calvinklein_calvinklein_reversible_leather_belt);
            var prod_calvinklein_calvinklein_ck_one_eau_de_toilette = new Product
            {
                SellerId = seller_calvinklein.Id,
                CategoryId = catAccessories.Id,
                Name = "NÆ°á»›c Hoa CK One Unisex Eau de Toilette 100ml",
                Slug = "calvinklein-calvinklein-ck-one-eau-de-toilette",
                Sku = "CAL-TOIL-3",
                CollectionName = "CK Fragrances",
                Description = "NÆ°á»›c Hoa CK One Unisex Eau de Toilette 100ml chÃ­nh hÃ£ng tá»« Calvin Klein. Cháº¿ tÃ¡c tá»« HÆ°Æ¡ng thÆ¡m cam chanh trÃ  xanh phÃ³ng khoÃ¡ng tÆ°Æ¡i mÃ¡t vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1950000m,
                OriginalPrice = 2250000m,
                DiscountPercent = 13,
                ImageUrl = "/img/brands/calvinklein/calvinklein-ck-one-eau-de-toilette.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/calvinklein/calvinklein-ck-one-eau-de-toilette.jpg", "/img/brands/calvinklein/calvinklein-ck-one-eau-de-toilette.jpg", "/img/brands/calvinklein/calvinklein-ck-one-eau-de-toilette.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "HÆ°Æ¡ng thÆ¡m cam chanh trÃ  xanh phÃ³ng khoÃ¡ng tÆ°Æ¡i mÃ¡t",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Calvin Klein, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_calvinklein_calvinklein_ck_one_eau_de_toilette.Variants.Add(new ProductVariant { Sku = "CAL-TOIL-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 1950000m, StockQuantity = 50 });
            allProducts.Add(prod_calvinklein_calvinklein_ck_one_eau_de_toilette);
            var prod_calvinklein_calvinklein_minimalist_camera_bag = new Product
            {
                SellerId = seller_calvinklein.Id,
                CategoryId = catAccessories.Id,
                Name = "TÃºi Äeo ChÃ©o Minimalist Faux Leather Camera Bag",
                Slug = "calvinklein-calvinklein-minimalist-camera-bag",
                Sku = "CAL-BAG-3",
                CollectionName = "CK Bags & Travel",
                Description = "TÃºi Äeo ChÃ©o Minimalist Faux Leather Camera Bag chÃ­nh hÃ£ng tá»« Calvin Klein. Cháº¿ tÃ¡c tá»« Da thuáº§n chay dáº­p vÃ¢n nháº¹, khÃ³a kÃ©o cháº¯c cháº¯n in ná»•i logo vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2450000m,
                OriginalPrice = 2890000m,
                DiscountPercent = 15,
                ImageUrl = "/img/brands/calvinklein/calvinklein-minimalist-camera-bag.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/calvinklein/calvinklein-minimalist-camera-bag.jpg", "/img/brands/calvinklein/calvinklein-minimalist-camera-bag.jpg", "/img/brands/calvinklein/calvinklein-minimalist-camera-bag.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da thuáº§n chay dáº­p vÃ¢n nháº¹, khÃ³a kÃ©o cháº¯c cháº¯n in ná»•i logo",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Calvin Klein, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_calvinklein_calvinklein_minimalist_camera_bag.Variants.Add(new ProductVariant { Sku = "CAL-BAG-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 2450000m, StockQuantity = 50 });
            allProducts.Add(prod_calvinklein_calvinklein_minimalist_camera_bag);

            var seller_tommyhilfiger = dbUsers.First(u => u.Email == "tommyhilfiger@gmail.com");
            var prod_tommyhilfiger_tommyhilfiger_classic_oxford_shirt = new Product
            {
                SellerId = seller_tommyhilfiger.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão SÆ¡ Mi Nam Classic Oxford Button-Down Shirt",
                Slug = "tommyhilfiger-tommyhilfiger-classic-oxford-shirt",
                Sku = "TOM-SHIR-2",
                CollectionName = "Tommy Classic Oxford",
                Description = "Ão SÆ¡ Mi Nam Classic Oxford Button-Down Shirt chÃ­nh hÃ£ng tá»« Tommy Hilfiger. Cháº¿ tÃ¡c tá»« Cháº¥t váº£i dá»‡t Oxford cotton cao cáº¥p thÃªu cá» Tommy nhá» á»Ÿ ngá»±c vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2450000m,
                OriginalPrice = 2850000m,
                DiscountPercent = 14,
                ImageUrl = "/img/brands/tommyhilfiger/tommyhilfiger-classic-oxford-shirt.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/tommyhilfiger/tommyhilfiger-classic-oxford-shirt.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-classic-oxford-shirt.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-classic-oxford-shirt.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Cháº¥t váº£i dá»‡t Oxford cotton cao cáº¥p thÃªu cá» Tommy nhá» á»Ÿ ngá»±c",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Tommy Hilfiger, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_tommyhilfiger_tommyhilfiger_classic_oxford_shirt.Variants.Add(new ProductVariant { Sku = "TOM-SHIR-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 2450000m, StockQuantity = 15 });
            prod_tommyhilfiger_tommyhilfiger_classic_oxford_shirt.Variants.Add(new ProductVariant { Sku = "TOM-SHIR-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 2450000m, StockQuantity = 20 });
            prod_tommyhilfiger_tommyhilfiger_classic_oxford_shirt.Variants.Add(new ProductVariant { Sku = "TOM-SHIR-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 2450000m, StockQuantity = 15 });
            allProducts.Add(prod_tommyhilfiger_tommyhilfiger_classic_oxford_shirt);
            var prod_tommyhilfiger_tommyhilfiger_colorblock_windbreaker = new Product
            {
                SellerId = seller_tommyhilfiger.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão GiÃ³ Du Thuyá»n Colorblock Windbreaker Yacht Jacket",
                Slug = "tommyhilfiger-tommyhilfiger-colorblock-windbreaker",
                Sku = "TOM-WIND-2",
                CollectionName = "Tommy Yacht Club",
                Description = "Ão GiÃ³ Du Thuyá»n Colorblock Windbreaker Yacht Jacket chÃ­nh hÃ£ng tá»« Tommy Hilfiger. Cháº¿ tÃ¡c tá»« Phá»‘i 3 mÃ u cá» Xanh - Tráº¯ng - Äá» biá»ƒu tÆ°á»£ng thÆ°Æ¡ng hiá»‡u Má»¹ vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 3850000m,
                OriginalPrice = 4400000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/tommyhilfiger/tommyhilfiger-colorblock-windbreaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/tommyhilfiger/tommyhilfiger-colorblock-windbreaker.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-colorblock-windbreaker.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-colorblock-windbreaker.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Phá»‘i 3 mÃ u cá» Xanh - Tráº¯ng - Äá» biá»ƒu tÆ°á»£ng thÆ°Æ¡ng hiá»‡u Má»¹",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Tommy Hilfiger, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_tommyhilfiger_tommyhilfiger_colorblock_windbreaker.Variants.Add(new ProductVariant { Sku = "TOM-WIND-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 3850000m, StockQuantity = 15 });
            prod_tommyhilfiger_tommyhilfiger_colorblock_windbreaker.Variants.Add(new ProductVariant { Sku = "TOM-WIND-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 3850000m, StockQuantity = 20 });
            prod_tommyhilfiger_tommyhilfiger_colorblock_windbreaker.Variants.Add(new ProductVariant { Sku = "TOM-WIND-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 3850000m, StockQuantity = 15 });
            allProducts.Add(prod_tommyhilfiger_tommyhilfiger_colorblock_windbreaker);
            var prod_tommyhilfiger_tommyhilfiger_heritage_flag_sweater = new Product
            {
                SellerId = seller_tommyhilfiger.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão Len Váº·n Thá»«ng Heritage Flag Cable Knit Sweater",
                Slug = "tommyhilfiger-tommyhilfiger-heritage-flag-sweater",
                Sku = "TOM-SWEA-2",
                CollectionName = "Tommy Heritage Knit",
                Description = "Ão Len Váº·n Thá»«ng Heritage Flag Cable Knit Sweater chÃ­nh hÃ£ng tá»« Tommy Hilfiger. Cháº¿ tÃ¡c tá»« Len pha cotton dá»‡t váº·n thá»«ng dÃ y dáº·n giá»¯ áº¥m phong cÃ¡ch preppy vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 3250000m,
                OriginalPrice = 3750000m,
                DiscountPercent = 13,
                ImageUrl = "/img/brands/tommyhilfiger/tommyhilfiger-heritage-flag-sweater.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/tommyhilfiger/tommyhilfiger-heritage-flag-sweater.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-heritage-flag-sweater.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-heritage-flag-sweater.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Len pha cotton dá»‡t váº·n thá»«ng dÃ y dáº·n giá»¯ áº¥m phong cÃ¡ch preppy",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Tommy Hilfiger, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_tommyhilfiger_tommyhilfiger_heritage_flag_sweater.Variants.Add(new ProductVariant { Sku = "TOM-SWEA-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 3250000m, StockQuantity = 15 });
            prod_tommyhilfiger_tommyhilfiger_heritage_flag_sweater.Variants.Add(new ProductVariant { Sku = "TOM-SWEA-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 3250000m, StockQuantity = 20 });
            prod_tommyhilfiger_tommyhilfiger_heritage_flag_sweater.Variants.Add(new ProductVariant { Sku = "TOM-SWEA-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 3250000m, StockQuantity = 15 });
            allProducts.Add(prod_tommyhilfiger_tommyhilfiger_heritage_flag_sweater);
            var prod_tommyhilfiger_tommyhilfiger_straight_fit_chino = new Product
            {
                SellerId = seller_tommyhilfiger.Id,
                CategoryId = catStreetwear.Id,
                Name = "Quáº§n Kaki Nam Essential Straight Fit Chino Pants",
                Slug = "tommyhilfiger-tommyhilfiger-straight-fit-chino",
                Sku = "TOM-CHIN-2",
                CollectionName = "Tommy Chino Pants",
                Description = "Quáº§n Kaki Nam Essential Straight Fit Chino Pants chÃ­nh hÃ£ng tá»« Tommy Hilfiger. Cháº¿ tÃ¡c tá»« Váº£i twill co giÃ£n nháº¹ bá»n bá»‰, Ä‘Æ°á»ng cáº¯t may á»‘ng Ä‘á»©ng chuáº©n má»±c vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2250000m,
                OriginalPrice = 2600000m,
                DiscountPercent = 13,
                ImageUrl = "/img/brands/tommyhilfiger/tommyhilfiger-straight-fit-chino.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/tommyhilfiger/tommyhilfiger-straight-fit-chino.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-straight-fit-chino.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-straight-fit-chino.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Váº£i twill co giÃ£n nháº¹ bá»n bá»‰, Ä‘Æ°á»ng cáº¯t may á»‘ng Ä‘á»©ng chuáº©n má»±c",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Tommy Hilfiger, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_tommyhilfiger_tommyhilfiger_straight_fit_chino.Variants.Add(new ProductVariant { Sku = "TOM-CHIN-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 2250000m, StockQuantity = 15 });
            prod_tommyhilfiger_tommyhilfiger_straight_fit_chino.Variants.Add(new ProductVariant { Sku = "TOM-CHIN-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 2250000m, StockQuantity = 20 });
            prod_tommyhilfiger_tommyhilfiger_straight_fit_chino.Variants.Add(new ProductVariant { Sku = "TOM-CHIN-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 2250000m, StockQuantity = 15 });
            allProducts.Add(prod_tommyhilfiger_tommyhilfiger_straight_fit_chino);
            var prod_tommyhilfiger_tommyhilfiger_retro_flag_leather_sneaker = new Product
            {
                SellerId = seller_tommyhilfiger.Id,
                CategoryId = catSneaker.Id,
                Name = "GiÃ y Sneaker Da Nam Retro Flag Low-Top Leather",
                Slug = "tommyhilfiger-tommyhilfiger-retro-flag-leather-sneaker",
                Sku = "TOM-SNEA-1",
                CollectionName = "Tommy Footwear",
                Description = "GiÃ y Sneaker Da Nam Retro Flag Low-Top Leather chÃ­nh hÃ£ng tá»« Tommy Hilfiger. Cháº¿ tÃ¡c tá»« Da bÃ² tráº¯ng trÆ¡n viá»n sá»c cá» Tommy bÃªn hÃ´ng, Ä‘áº¿ cao su Ãªm Ã¡i vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 2950000m,
                OriginalPrice = 3400000m,
                DiscountPercent = 13,
                ImageUrl = "/img/brands/tommyhilfiger/tommyhilfiger-retro-flag-leather-sneaker.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/tommyhilfiger/tommyhilfiger-retro-flag-leather-sneaker.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-retro-flag-leather-sneaker.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-retro-flag-leather-sneaker.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² tráº¯ng trÆ¡n viá»n sá»c cá» Tommy bÃªn hÃ´ng, Ä‘áº¿ cao su Ãªm Ã¡i",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Tommy Hilfiger, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_tommyhilfiger_tommyhilfiger_retro_flag_leather_sneaker.Variants.Add(new ProductVariant { Sku = "TOM-SNEA-1-40", Size = "EU 40", Color = "TiÃªu chuáº©n", Price = 2950000m, StockQuantity = 15 });
            prod_tommyhilfiger_tommyhilfiger_retro_flag_leather_sneaker.Variants.Add(new ProductVariant { Sku = "TOM-SNEA-1-41", Size = "EU 41", Color = "TiÃªu chuáº©n", Price = 2950000m, StockQuantity = 20 });
            prod_tommyhilfiger_tommyhilfiger_retro_flag_leather_sneaker.Variants.Add(new ProductVariant { Sku = "TOM-SNEA-1-42", Size = "EU 42", Color = "TiÃªu chuáº©n", Price = 2950000m, StockQuantity = 15 });
            allProducts.Add(prod_tommyhilfiger_tommyhilfiger_retro_flag_leather_sneaker);
            var prod_tommyhilfiger_tommyhilfiger_varsity_wool_bomber = new Product
            {
                SellerId = seller_tommyhilfiger.Id,
                CategoryId = catStreetwear.Id,
                Name = "Ão KhoÃ¡c BÃ³ng ChÃ y Varsity Wool Blend Bomber",
                Slug = "tommyhilfiger-tommyhilfiger-varsity-wool-bomber",
                Sku = "TOM-BOMB-2",
                CollectionName = "Tommy Varsity",
                Description = "Ão KhoÃ¡c BÃ³ng ChÃ y Varsity Wool Blend Bomber chÃ­nh hÃ£ng tá»« Tommy Hilfiger. Cháº¿ tÃ¡c tá»« ThÃ¢n Ã¡o len dáº¡ pha da, thÃªu logo chá»¯ TH phong cÃ¡ch há»c Ä‘Æ°á»ng Má»¹ vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 5950000m,
                OriginalPrice = 6800000m,
                DiscountPercent = 12,
                ImageUrl = "/img/brands/tommyhilfiger/tommyhilfiger-varsity-wool-bomber.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/tommyhilfiger/tommyhilfiger-varsity-wool-bomber.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-varsity-wool-bomber.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-varsity-wool-bomber.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "ThÃ¢n Ã¡o len dáº¡ pha da, thÃªu logo chá»¯ TH phong cÃ¡ch há»c Ä‘Æ°á»ng Má»¹",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Tommy Hilfiger, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_tommyhilfiger_tommyhilfiger_varsity_wool_bomber.Variants.Add(new ProductVariant { Sku = "TOM-BOMB-2-S", Size = "Size S", Color = "TiÃªu chuáº©n", Price = 5950000m, StockQuantity = 15 });
            prod_tommyhilfiger_tommyhilfiger_varsity_wool_bomber.Variants.Add(new ProductVariant { Sku = "TOM-BOMB-2-M", Size = "Size M", Color = "TiÃªu chuáº©n", Price = 5950000m, StockQuantity = 20 });
            prod_tommyhilfiger_tommyhilfiger_varsity_wool_bomber.Variants.Add(new ProductVariant { Sku = "TOM-BOMB-2-L", Size = "Size L", Color = "TiÃªu chuáº©n", Price = 5950000m, StockQuantity = 15 });
            allProducts.Add(prod_tommyhilfiger_tommyhilfiger_varsity_wool_bomber);
            var prod_tommyhilfiger_tommyhilfiger_global_stripe_wallet = new Product
            {
                SellerId = seller_tommyhilfiger.Id,
                CategoryId = catAccessories.Id,
                Name = "VÃ­ Da Gáº­p Nam Global Stripe Leather Billfold Wallet",
                Slug = "tommyhilfiger-tommyhilfiger-global-stripe-wallet",
                Sku = "TOM-WALL-3",
                CollectionName = "Tommy Accessories",
                Description = "VÃ­ Da Gáº­p Nam Global Stripe Leather Billfold Wallet chÃ­nh hÃ£ng tá»« Tommy Hilfiger. Cháº¿ tÃ¡c tá»« Da bÃ² cao cáº¥p dáº­p viá»n sá»c cá» nhá», 8 ngÄƒn cáº¯m tháº» sang trá»ng vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1650000m,
                OriginalPrice = 1950000m,
                DiscountPercent = 15,
                ImageUrl = "/img/brands/tommyhilfiger/tommyhilfiger-global-stripe-wallet.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/tommyhilfiger/tommyhilfiger-global-stripe-wallet.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-global-stripe-wallet.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-global-stripe-wallet.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "Da bÃ² cao cáº¥p dáº­p viá»n sá»c cá» nhá», 8 ngÄƒn cáº¯m tháº» sang trá»ng",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Tommy Hilfiger, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_tommyhilfiger_tommyhilfiger_global_stripe_wallet.Variants.Add(new ProductVariant { Sku = "TOM-WALL-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 1650000m, StockQuantity = 50 });
            allProducts.Add(prod_tommyhilfiger_tommyhilfiger_global_stripe_wallet);
            var prod_tommyhilfiger_tommyhilfiger_cologne_spray = new Product
            {
                SellerId = seller_tommyhilfiger.Id,
                CategoryId = catAccessories.Id,
                Name = "NÆ°á»›c Hoa Tommy Girl & Boy Eau de Cologne 100ml",
                Slug = "tommyhilfiger-tommyhilfiger-cologne-spray",
                Sku = "TOM-SPRA-3",
                CollectionName = "Tommy Fragrance",
                Description = "NÆ°á»›c Hoa Tommy Girl & Boy Eau de Cologne 100ml chÃ­nh hÃ£ng tá»« Tommy Hilfiger. Cháº¿ tÃ¡c tá»« HÆ°Æ¡ng hoa quáº£ tÆ°Æ¡i mÃ¡t ngáº­p trÃ n nÄƒng lÆ°á»£ng tuá»•i tráº» nÆ°á»›c Má»¹ vá»›i quy trÃ¬nh kiá»ƒm Ä‘á»‹nh cháº¥t lÆ°á»£ng nghiÃªm ngáº·t cá»§a nhÃ  má»‘t.",
                BasePrice = 1850000m,
                OriginalPrice = 2150000m,
                DiscountPercent = 14,
                ImageUrl = "/img/brands/tommyhilfiger/tommyhilfiger-cologne-spray.jpg",
                GalleryUrlsJson = JsonSerializer.Serialize(new[] { "/img/brands/tommyhilfiger/tommyhilfiger-cologne-spray.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-cologne-spray.jpg", "/img/brands/tommyhilfiger/tommyhilfiger-cologne-spray.jpg" }),
                StockQuantity = 50,
                StockStatus = StockStatus.InStock,
                Material = "HÆ°Æ¡ng hoa quáº£ tÆ°Æ¡i mÃ¡t ngáº­p trÃ n nÄƒng lÆ°á»£ng tuá»•i tráº» nÆ°á»›c Má»¹",
                CareInstructions = "Vá»‡ sinh chuyÃªn biá»‡t, báº£o quáº£n trong tÃºi váº£i thoÃ¡ng khÃ­ táº¡i nÆ¡i khÃ´ rÃ¡o",
                PackagingDetails = "Há»™p quÃ  táº·ng cao cáº¥p cá»§a Tommy Hilfiger, tÃºi bá»¥i, ruy bÄƒng niÃªm phong vÃ  tháº» xÃ¡c thá»±c NFC",
                CountryOfOrigin = "Má»¹",
                Rating = 4.9,
                ReviewCount = 86,
                IsActive = true
            };
            prod_tommyhilfiger_tommyhilfiger_cologne_spray.Variants.Add(new ProductVariant { Sku = "TOM-SPRA-3-STD", Size = "Freesize", Color = "TiÃªu chuáº©n", Price = 1850000m, StockQuantity = 50 });
            allProducts.Add(prod_tommyhilfiger_tommyhilfiger_cologne_spray);

            await context.Products.AddRangeAsync(allProducts);
            await context.SaveChangesAsync();
        }

        // ==========================================
        // 5. Náº P ÄÆ N HÃ€NG & GIAO Dá»ŠCH
        // ==========================================
        if (!await context.Orders.AnyAsync())
        {
            var customer = await context.Users.FirstOrDefaultAsync(u => u.Email == "esther.howard@example.com");
            var products = await context.Products.Take(10).ToListAsync();

            if (products.Count >= 3)
            {
                var order1 = new Order
                {
                    OrderCode = "AG-2024-7890",
                    UserId = customer?.Id,
                    CustomerName = "Esther Howard",
                    CustomerEmail = "esther.howard@example.com",
                    CustomerPhone = "+84 902 345 678",
                    ShippingAddress = "Villa 18, Vinhomes Riverside, Long BiÃªn, HÃ  Ná»™i",
                    PaymentMethod = "Tháº» TÃ­n Dá»¥ng Quá»‘c Táº¿ (Visa Signature)",
                    Status = OrderStatus.Delivered,
                    PaymentStatus = PaymentStatus.Paid,
                    Carrier = "FedEx Priority Luxury Express",
                    TrackingCode = "FX-VN-882910384",
                    EstimatedDelivery = "ÄÃ£ giao thÃ nh cÃ´ng",
                    LastUpdateLocation = "Kho trung chuyá»ƒn Ná»™i BÃ i - ÄÃ£ kÃ½ nháº­n",
                    ProgressStep = 4,
                    Subtotal = products[0].BasePrice,
                    ShippingCharge = 0,
                    Taxes = 0,
                    Discount = 0,
                    TotalAmount = products[0].BasePrice
                };
                order1.Items.Add(new OrderItem
                {
                    ProductId = products[0].Id,
                    ProductName = products[0].Name,
                    Specs = "EU 41 / Da tháº­t / Fullbox",
                    ImageUrl = products[0].ImageUrl,
                    Price = products[0].BasePrice,
                    Quantity = 1,
                    Subtotal = products[0].BasePrice
                });

                var order2 = new Order
                {
                    OrderCode = "AG-2024-7891",
                    UserId = customer?.Id,
                    CustomerName = "Tráº§n Thá»‹ Mai PhÆ°Æ¡ng",
                    CustomerEmail = "maiphuong.tran@gmail.com",
                    CustomerPhone = "+84 912 888 999",
                    ShippingAddress = "Penthouse 3201, Diamond Island, Quáº­n 2, TP. Há»“ ChÃ­ Minh",
                    PaymentMethod = "Chuyá»ƒn Khoáº£n NgÃ¢n HÃ ng Tá»©c Thá»i (VietQR Pro)",
                    Status = OrderStatus.Shipped,
                    PaymentStatus = PaymentStatus.Paid,
                    Carrier = "Aethelgard White-Glove Courier",
                    TrackingCode = "AG-VIP-994812",
                    EstimatedDelivery = "Dá»± kiáº¿n giao trong 24 giá»",
                    LastUpdateLocation = "Trung tÃ¢m phÃ¢n loáº¡i TÃ¢n SÆ¡n Nháº¥t - Äang luÃ¢n chuyá»ƒn",
                    ProgressStep = 3,
                    Subtotal = products[1].BasePrice,
                    ShippingCharge = 50000,
                    Taxes = 0,
                    Discount = 0,
                    TotalAmount = products[1].BasePrice + 50000
                };
                order2.Items.Add(new OrderItem
                {
                    ProductId = products[1].Id,
                    ProductName = products[1].Name,
                    Specs = "Size L / Báº£n giá»›i háº¡n",
                    ImageUrl = products[1].ImageUrl,
                    Price = products[1].BasePrice,
                    Quantity = 1,
                    Subtotal = products[1].BasePrice
                });

                var order3 = new Order
                {
                    OrderCode = "AG-2024-7892",
                    UserId = customer?.Id,
                    CustomerName = "LÃª HoÃ ng Nam",
                    CustomerEmail = "hoangnam.le@vng.com.vn",
                    CustomerPhone = "+84 983 222 111",
                    ShippingAddress = "TÃ²a nhÃ  Keangnam Landmark 72, Pháº¡m HÃ¹ng, Cáº§u Giáº¥y, HÃ  Ná»™i",
                    PaymentMethod = "Tháº» TÃ­n Dá»¥ng Quá»‘c Táº¿ (Mastercard World Elite)",
                    Status = OrderStatus.Confirmed,
                    PaymentStatus = PaymentStatus.Paid,
                    Carrier = "FedEx Priority Luxury Express",
                    TrackingCode = "FX-VN-900213441",
                    EstimatedDelivery = "Dá»± kiáº¿n giao ngÃ y mai",
                    LastUpdateLocation = "ÄÃ£ niÃªm phong gÃ³i hÃ ng táº¡i Boutique chÃ­nh hÃ£ng",
                    ProgressStep = 2,
                    Subtotal = products[2].BasePrice,
                    ShippingCharge = 0,
                    Taxes = 0,
                    Discount = 0,
                    TotalAmount = products[2].BasePrice
                };
                order3.Items.Add(new OrderItem
                {
                    ProductId = products[2].Id,
                    ProductName = products[2].Name,
                    Specs = "EU 42 / TiÃªu chuáº©n",
                    ImageUrl = products[2].ImageUrl,
                    Price = products[2].BasePrice,
                    Quantity = 1,
                    Subtotal = products[2].BasePrice
                });

                await context.Orders.AddRangeAsync(order1, order2, order3);
                await context.SaveChangesAsync();

                var transactions = new List<TransactionRecord>
                {
                    new TransactionRecord { TransactionCode = "#TXN-04910", CustomerName = order1.CustomerName, ProductName = products[0].Name, Status = "Success", Quantity = 1, UnitPrice = products[0].BasePrice, TotalAmount = order1.TotalAmount },
                    new TransactionRecord { TransactionCode = "#TXN-04911", CustomerName = order2.CustomerName, ProductName = products[1].Name, Status = "Success", Quantity = 1, UnitPrice = products[1].BasePrice, TotalAmount = order2.TotalAmount },
                    new TransactionRecord { TransactionCode = "#TXN-04912", CustomerName = order3.CustomerName, ProductName = products[2].Name, Status = "Success", Quantity = 1, UnitPrice = products[2].BasePrice, TotalAmount = order3.TotalAmount }
                };
                await context.Transactions.AddRangeAsync(transactions);
                await context.SaveChangesAsync();
            }
        }

        if (!await context.Reviews.AnyAsync())
        {
            await SeedReviewsAsync(context);
        }
    }

    public static async Task EnsureReviewsTableAsync(ApplicationDbContext context)
    {
        try
        {
            if (context.Database.IsSqlite())
            {
                await context.Database.ExecuteSqlRawAsync(
                    "CREATE TABLE IF NOT EXISTS Reviews (" +
                    "Id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    "ProductId INTEGER NOT NULL, " +
                    "UserId INTEGER NULL, " +
                    "CustomerName TEXT NOT NULL, " +
                    "Rating INTEGER NOT NULL, " +
                    "Comment TEXT NOT NULL, " +
                    "IsVerifiedPurchase INTEGER DEFAULT 1, " +
                    "HelpfulCount INTEGER DEFAULT 0, " +
                    "ShopReply TEXT NULL, " +
                    "ShopReplyAt TEXT NULL, " +
                    "CreatedAt TEXT NOT NULL, " +
                    "UpdatedAt TEXT NULL, " +
                    "FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE);"
                );

                var conn = context.Database.GetDbConnection();
                var shouldClose = false;
                if (conn.State != System.Data.ConnectionState.Open)
                {
                    await conn.OpenAsync();
                    shouldClose = true;
                }

                var existingColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "PRAGMA table_info(Reviews);";
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        existingColumns.Add(reader.GetString(1));
                    }
                }

                var columnsToAdd = new (string ColName, string Ddl)[]
                {
                    ("IsVerifiedPurchase", "ALTER TABLE Reviews ADD COLUMN IsVerifiedPurchase INTEGER DEFAULT 1;"),
                    ("HelpfulCount", "ALTER TABLE Reviews ADD COLUMN HelpfulCount INTEGER DEFAULT 0;"),
                    ("ShopReply", "ALTER TABLE Reviews ADD COLUMN ShopReply TEXT NULL;"),
                    ("ShopReplyAt", "ALTER TABLE Reviews ADD COLUMN ShopReplyAt TEXT NULL;")
                };

                foreach (var (colName, ddl) in columnsToAdd)
                {
                    if (!existingColumns.Contains(colName))
                    {
                        using var cmd = conn.CreateCommand();
                        cmd.CommandText = ddl;
                        await cmd.ExecuteNonQueryAsync();
                    }
                }

                if (shouldClose)
                {
                    await conn.CloseAsync();
                }
            }
        }
        catch
        {
            // Bá» qua náº¿u báº£ng Ä‘Ã£ tá»“n táº¡i hoáº·c CSDL khÃ¡c
        }
    }

    public static async Task EnsureAdminColumnsAsync(ApplicationDbContext context)
    {
        try
        {
            if (context.Database.IsSqlite())
            {
                var conn = context.Database.GetDbConnection();
                var shouldClose = false;
                if (conn.State != System.Data.ConnectionState.Open)
                {
                    await conn.OpenAsync();
                    shouldClose = true;
                }

                var existingColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "PRAGMA table_info(Users);";
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        existingColumns.Add(reader.GetString(1));
                    }
                }

                var columnsToAdd = new (string ColName, string Ddl)[]
                {
                    ("SellerStatus", "ALTER TABLE Users ADD COLUMN SellerStatus TEXT DEFAULT 'Active';"),
                    ("IsMallVerified", "ALTER TABLE Users ADD COLUMN IsMallVerified INTEGER DEFAULT 1;"),
                    ("SuspendedReason", "ALTER TABLE Users ADD COLUMN SuspendedReason TEXT NULL;"),
                    ("KycNotes", "ALTER TABLE Users ADD COLUMN KycNotes TEXT NULL;"),
                    ("CommissionRate", "ALTER TABLE Users ADD COLUMN CommissionRate REAL DEFAULT 3.5;")
                };

                foreach (var (colName, ddl) in columnsToAdd)
                {
                    if (!existingColumns.Contains(colName))
                    {
                        using var cmd = conn.CreateCommand();
                        cmd.CommandText = ddl;
                        await cmd.ExecuteNonQueryAsync();
                    }
                }

                if (shouldClose)
                {
                    await conn.CloseAsync();
                }
            }
        }
        catch
        {
            // Bỏ qua nếu có lỗi
        }
    }

    public static async Task SeedReviewsAsync(ApplicationDbContext context)
    {
        if (await context.Reviews.AnyAsync()) return;

        var products = await context.Products.Take(10).ToListAsync();
        if (!products.Any()) return;

        var sampleReviews = new List<Review>
        {
            new Review
            {
                ProductId = products[0].Id,
                CustomerName = "Tráº§n HoÃ ng Nam",
                Rating = 5,
                Comment = "Cháº¥t liá»‡u da thÆ°á»£ng háº¡ng, Ä‘Æ°á»ng may tinh xáº£o tuyá»‡t Ä‘á»‘i. Mang vÃ o ráº¥t Ãªm chÃ¢n vÃ  chuáº©n phom. ÄÃºng chuáº©n xa xá»‰ Aethelgard!",
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new Review
            {
                ProductId = products[0].Id,
                CustomerName = "Nguyá»…n ThÃ¹y Linh",
                Rating = 5,
                Comment = "ÄÃ³ng gÃ³i cáº©n tháº­n 2 lá»›p há»™p, cÃ³ tháº» báº£o hÃ nh vÃ  tÃºi váº£i xá»‹n. NhÃ¢n viÃªn tÆ° váº¥n phá»‘i Ä‘á»“ AI gá»£i Ã½ cá»±c ká»³ chuáº©n.",
                CreatedAt = DateTime.UtcNow.AddDays(-7)
            },
            new Review
            {
                ProductId = products[0].Id,
                CustomerName = "Pháº¡m Quang ÄÄƒng",
                Rating = 4,
                Comment = "Sáº£n pháº©m thá»±c táº¿ Ä‘áº¹p hÆ¡n trÃªn áº£nh. Giao hÃ ng há»a tá»‘c trong 2 ngÃ y ráº¥t áº¥n tÆ°á»£ng.",
                CreatedAt = DateTime.UtcNow.AddDays(-12)
            }
        };

        if (products.Count > 1)
        {
            sampleReviews.Add(new Review
            {
                ProductId = products[1].Id,
                CustomerName = "LÃª Báº£o TrÃ¢m",
                Rating = 5,
                Comment = "MÃ u sáº¯c ráº¥t sang trá»ng, Ä‘i tiá»‡c ai cÅ©ng khen. Ráº¥t hÃ i lÃ²ng vá» cháº¥t lÆ°á»£ng sáº£n pháº©m.",
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            });
        }

        await context.Reviews.AddRangeAsync(sampleReviews);
        await context.SaveChangesAsync();
    }

    public static async Task EnsurePerformanceOptimizationsAsync(ApplicationDbContext context)
    {
        try
        {
            if (context.Database.IsSqlite())
            {
                // WAL mode & performance PRAGMAs (Item 52)
                await context.Database.ExecuteSqlRawAsync("PRAGMA journal_mode = WAL;");
                await context.Database.ExecuteSqlRawAsync("PRAGMA synchronous = NORMAL;");
                await context.Database.ExecuteSqlRawAsync("PRAGMA temp_store = MEMORY;");

                // Composite & High-Speed Query Indexes (Item 41)
                await context.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Orders_Status ON Orders (Status);");
                await context.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Orders_CreatedAt ON Orders (CreatedAt);");
                await context.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Orders_UserId_CreatedAt ON Orders (UserId, CreatedAt);");
                await context.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_OrderItems_OrderId ON OrderItems (OrderId);");
                await context.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_OrderItems_ProductId ON OrderItems (ProductId);");
                await context.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Products_SellerId ON Products (SellerId);");
                await context.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Products_CategoryId ON Products (CategoryId);");
                await context.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Products_StockQuantity ON Products (StockQuantity);");
                await context.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Products_IsActive_CreatedAt ON Products (IsActive, CreatedAt);");
            }
        }
        catch
        {
            // Bỏ qua nếu đang chạy provider khác hoặc index đã tồn tại
        }
    }
}
