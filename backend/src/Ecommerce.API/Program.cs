using Ecommerce.API.Configurations;
using Ecommerce.API.Middlewares;
using Ecommerce.DAL.Context;
using Ecommerce.DAL.Seed;

var builder = WebApplication.CreateBuilder(args);

// Đăng ký các dịch vụ vào container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddSwaggerDocumentation();

var app = builder.Build();

// Cấu hình pipeline xử lý HTTP request
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Aethelgard Mall API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Tự động nạp dữ liệu CSDL khi ứng dụng khởi động
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        logger.LogInformation("Đang kiểm tra và khởi tạo dữ liệu CSDL tự động...");
        await DatabaseSeeder.SeedAsync(context);
        logger.LogInformation("Khởi tạo dữ liệu CSDL hoàn tất thành công!");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Lỗi xảy ra trong quá trình nạp dữ liệu: {Message}", ex.Message);
    }
}

app.Run();

// Cần cho WebApplicationFactory trong Integration Tests
public partial class Program { }
