using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Ecommerce.BLL.Interfaces;
using Ecommerce.Common.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponseDto>> Register([FromBody] RegisterRequestDto request)
    {
        var result = await _authService.RegisterAsync(request);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        var subject = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!int.TryParse(subject, out var userId))
            return Unauthorized();

        await _authService.ChangePasswordAsync(userId, request);
        return NoContent();
    }

    [EnableRateLimiting("PasswordReset")]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request)
    {
        if (!await _authService.SendPasswordResetOtpAsync(request))
            return StatusCode(503, new { success = false, message = "Dịch vụ email đặt lại mật khẩu hiện chưa khả dụng." });
        return Ok(new { success = true, message = "Nếu email đã đăng ký, bạn sẽ nhận được mã đặt lại mật khẩu." });
    }

    [EnableRateLimiting("PasswordReset")]
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto request)
    {
        var isValid = await _authService.VerifyOtpAsync(request);
        if (!isValid)
            return BadRequest(new { success = false, message = "Mã OTP không hợp lệ hoặc đã hết hạn." });

        return Ok(new { success = true, message = "Xác thực OTP thành công." });
    }

    [EnableRateLimiting("PasswordReset")]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
    {
        await _authService.ResetPasswordAsync(request);
        return Ok(new { success = true, message = "Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới." });
    }
}
