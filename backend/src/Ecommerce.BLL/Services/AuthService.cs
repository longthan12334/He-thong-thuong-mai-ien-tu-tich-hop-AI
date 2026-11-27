using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Ecommerce.BLL.Interfaces;
using Ecommerce.Common.DTOs;
using Ecommerce.Common.Entities;
using Ecommerce.Common.Enums;
using Ecommerce.Common.Exceptions;
using Ecommerce.DAL.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Ecommerce.BLL.Services;

public class AuthService : IAuthService
{
    private static readonly HttpClient GoogleHttpClient = new();
    private const string AdminGoogleEmail = "nguyenducmanh.ovaltine@gmail.com";
    private const string GucciSellerGoogleEmail = "nguyenducmanh.ducmanhjr@gmail.com";

    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;

    public AuthService(IUnitOfWork unitOfWork, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
    }

    public static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var hash = HashPassword(request.Password);
        var email = (request.Email ?? string.Empty).Trim().ToLower();
        var users = await _unitOfWork.Users.FindAsync(u => 
            u.Email.ToLower() == email ||
            (u.Email.ToLower() == "off-white@gmail.com" && email == "offwhite@gmail.com") ||
            (u.Email.ToLower() == "offwhite@gmail.com" && email == "off-white@gmail.com")
        );
        var user = users.FirstOrDefault();

        if (user == null)
        {
            throw new UnauthorizedException("Email hoặc mật khẩu không chính xác.");
        }

        if (user.PasswordHash != hash)
            throw new UnauthorizedException("Email hoặc mật khẩu không chính xác.");

        if (!user.IsActive)
            throw new UnauthorizedException("Tài khoản của bạn đã bị khóa.");

        var token = GenerateJwtToken(user);

        return new LoginResponseDto
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            AvatarUrl = user.AvatarUrl
        };
    }

    public async Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        if (request.Role is not (Ecommerce.Common.Enums.UserRole.Customer or Ecommerce.Common.Enums.UserRole.Seller))
            throw new BadRequestException("Vai trò này không hỗ trợ đăng ký công khai.");

        var existing = (await _unitOfWork.Users.FindAsync(u => u.Email.ToLower() == request.Email.ToLower())).FirstOrDefault();
        if (existing != null)
        {
            throw new BadRequestException("Email đã được đăng ký tài khoản trong hệ thống.");
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            Role = request.Role,
            IsEmailVerified = true,
            AvatarUrl = "img/sample-nextgen.jpg"
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        var token = GenerateJwtToken(user);

        return new LoginResponseDto
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            AvatarUrl = user.AvatarUrl
        };
    }

    public async Task<bool> SendPasswordResetOtpAsync(ForgotPasswordDto request)
    {
        var host = _configuration["PasswordResetSmtp:Host"];
        var sender = _configuration["PasswordResetSmtp:From"];
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(sender))
            return false;

        var email = request.Email.Trim().ToLowerInvariant();
        var user = (await _unitOfWork.Users.FindAsync(u => u.Email.ToLower() == email)).FirstOrDefault();
        if (user == null)
            return true;

        if (user.ResetOtpExpiry > DateTime.UtcNow.AddMinutes(14))
            return true;

        var otp = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var issuedAt = DateTime.UtcNow;
        var expiresAt = issuedAt.AddMinutes(15);
        var allowedBefore = expiresAt.AddMinutes(-1);
        var account = _unitOfWork.Users.Query().Where(u => u.Id == user.Id);
        var issued = await account
            .Where(u => u.ResetOtpExpiry == null || u.ResetOtpExpiry <= allowedBefore)
            .ExecuteUpdateAsync(set => set
                .SetProperty(u => u.ResetOtp, otp)
                .SetProperty(u => u.ResetOtpExpiry, expiresAt));
        if (issued == 0)
            return true;

        var port = int.TryParse(_configuration["PasswordResetSmtp:Port"], out var smtpPort) ? smtpPort : 587;
        try
        {
            using var client = new SmtpClient(host, port) { EnableSsl = true };
            var username = _configuration["PasswordResetSmtp:Username"];
            if (!string.IsNullOrWhiteSpace(username))
                client.Credentials = new NetworkCredential(username, _configuration["PasswordResetSmtp:Password"]);

            using var message = new MailMessage(sender, user.Email,
                "Mã đặt lại mật khẩu Aethelgard Mall", $"Mã xác thực của bạn là {otp}. Mã hết hạn sau 15 phút.");
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(8));
            await client.SendMailAsync(message, timeout.Token);
        }
        catch
        {
            await account.Where(u => u.ResetOtp == otp && u.ResetOtpExpiry == expiresAt)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(u => u.ResetOtp, (string?)null)
                    .SetProperty(u => u.ResetOtpExpiry, (DateTime?)null));
            throw;
        }
        return true;
    }

    public async Task<bool> VerifyOtpAsync(VerifyOtpDto request)
    {
        return await QueryValidResetCode(request.Email, request.Otp).AnyAsync();
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordDto request)
    {
        var hash = HashPassword(request.NewPassword);
        var updated = await QueryValidResetCode(request.Email, request.Otp)
            .ExecuteUpdateAsync(set => set
                .SetProperty(u => u.PasswordHash, hash)
                .SetProperty(u => u.ResetOtp, (string?)null)
                .SetProperty(u => u.ResetOtpExpiry, (DateTime?)null)
                .SetProperty(u => u.UpdatedAt, DateTime.UtcNow));
        if (updated == 0)
            throw new BadRequestException("Mã xác thực OTP không đúng hoặc đã hết hạn.");

        return true;
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordDto request)
    {
        var currentHash = HashPassword(request.CurrentPassword);
        var newHash = HashPassword(request.NewPassword);
        var updated = await _unitOfWork.Users.Query()
            .Where(u => u.Id == userId && u.PasswordHash == currentHash)
            .ExecuteUpdateAsync(set => set
                .SetProperty(u => u.PasswordHash, newHash)
                .SetProperty(u => u.ResetOtp, (string?)null)
                .SetProperty(u => u.ResetOtpExpiry, (DateTime?)null)
                .SetProperty(u => u.UpdatedAt, DateTime.UtcNow));
        if (updated == 0)
            throw new BadRequestException("Mật khẩu hiện tại không chính xác.");
    }

    public async Task<LoginResponseDto> GoogleLoginAsync(GoogleLoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Credential))
            throw new BadRequestException("Thiếu mã xác thực Google.");

        var tokenInfoUrl = $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(request.Credential)}";
        using var response = await GoogleHttpClient.GetAsync(tokenInfoUrl);
        if (!response.IsSuccessStatusCode)
            throw new UnauthorizedException("Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn.");

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = doc.RootElement;

        var configuredClientId = _configuration["Google:ClientId"];
        if (!string.IsNullOrWhiteSpace(configuredClientId))
        {
            var aud = root.TryGetProperty("aud", out var audProp) ? audProp.GetString() : null;
            if (!string.Equals(aud, configuredClientId, StringComparison.Ordinal))
                throw new UnauthorizedException("Google Client ID không khớp với hệ thống.");
        }

        var emailVerified = root.TryGetProperty("email_verified", out var verifiedProp) &&
                            (verifiedProp.ValueKind == JsonValueKind.True ||
                             string.Equals(verifiedProp.GetString(), "true", StringComparison.OrdinalIgnoreCase));
        if (!emailVerified)
            throw new UnauthorizedException("Tài khoản Google chưa xác minh email.");

        var googleEmail = root.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
        if (string.IsNullOrWhiteSpace(googleEmail))
            throw new UnauthorizedException("Không lấy được email từ tài khoản Google.");

        var email = googleEmail.Trim().ToLowerInvariant();
        var googleName = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
        var googlePicture = root.TryGetProperty("picture", out var picProp) ? picProp.GetString() : null;

        User? user;
        if (email == AdminGoogleEmail)
        {
            user = (await _unitOfWork.Users.FindAsync(u => u.Email.ToLower() == email)).FirstOrDefault();
            if (user == null)
            {
                user = new User
                {
                    FullName = string.IsNullOrWhiteSpace(googleName) ? "Admin Aethelgard" : googleName.Trim(),
                    Email = email,
                    PasswordHash = HashPassword(Guid.NewGuid().ToString("N")),
                    Role = UserRole.Admin,
                    AvatarUrl = googlePicture,
                    IsEmailVerified = true,
                    IsActive = true,
                };
                await _unitOfWork.Users.AddAsync(user);
                await _unitOfWork.SaveChangesAsync();
            }
            else if (user.Role != UserRole.Admin)
            {
                user.Role = UserRole.Admin;
                _unitOfWork.Users.Update(user);
                await _unitOfWork.SaveChangesAsync();
            }
        }
        else if (email == GucciSellerGoogleEmail)
        {
            // Gắn trực tiếp với gian hàng Gucci Official (sellerId = 4 / gucci@gmail.com)
            user = (await _unitOfWork.Users.FindAsync(u =>
                u.Email.ToLower() == "gucci@gmail.com" || u.Email.ToLower() == email)).FirstOrDefault()
                ?? await _unitOfWork.Users.GetByIdAsync(4);

            if (user == null)
                throw new NotFoundException("Không tìm thấy tài khoản gian hàng Gucci trong hệ thống.");
        }
        else
        {
            user = (await _unitOfWork.Users.FindAsync(u => u.Email.ToLower() == email)).FirstOrDefault();
            if (user == null)
            {
                user = new User
                {
                    FullName = string.IsNullOrWhiteSpace(googleName) ? email.Split('@')[0] : googleName.Trim(),
                    Email = email,
                    PasswordHash = HashPassword(Guid.NewGuid().ToString("N")),
                    Role = UserRole.Customer,
                    AvatarUrl = googlePicture,
                    IsEmailVerified = true,
                    IsActive = true,
                };
                await _unitOfWork.Users.AddAsync(user);
                await _unitOfWork.SaveChangesAsync();
            }
            else if (!user.IsActive)
            {
                throw new UnauthorizedException("Tài khoản của bạn đã bị khóa.");
            }
        }

        if (!string.IsNullOrWhiteSpace(request.ExpectedRole))
        {
            if (request.ExpectedRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) && user.Role != UserRole.Admin)
                throw new UnauthorizedException("Tài khoản Google này không có quyền Quản trị viên (Admin).");
            if (request.ExpectedRole.Equals("Seller", StringComparison.OrdinalIgnoreCase) && user.Role != UserRole.Seller)
                throw new UnauthorizedException("Tài khoản Google này chưa được liên kết với gian hàng Người bán.");
        }

        var token = GenerateJwtToken(user);
        return new LoginResponseDto
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            AvatarUrl = user.AvatarUrl
        };
    }

    private IQueryable<User> QueryValidResetCode(string address, string code)
    {
        var email = address.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;
        return _unitOfWork.Users.Query().Where(u =>
            u.Email.ToLower() == email && u.ResetOtp == code && u.ResetOtpExpiry > now);
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "AethelgardSuperSecretKey2026NguyenDucManh9999!";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "AethelgardMall";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "AethelgardMallClients";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
