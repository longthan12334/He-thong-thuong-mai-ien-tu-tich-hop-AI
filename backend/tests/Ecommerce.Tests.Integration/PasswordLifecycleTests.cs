using System.Net;
using System.Net.Http.Json;
using Ecommerce.BLL.Services;
using Ecommerce.Common.DTOs;
using Ecommerce.Common.Entities;
using Ecommerce.Common.Exceptions;
using Ecommerce.DAL.Context;
using Ecommerce.BLL.Interfaces;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Ecommerce.Tests.Integration;

public class PasswordLifecycleTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task ResetCodeExpiresAndCanOnlyBeUsedOnce()
    {
        using var scope = factory.Services.CreateScope();
        var services = scope.ServiceProvider;
        var database = services.GetRequiredService<ApplicationDbContext>();
        var auth = services.GetRequiredService<IAuthService>();
        var user = new User
        {
            FullName = "Password lifecycle fixture",
            Email = $"password-test-{Guid.NewGuid():N}@example.test",
            PasswordHash = AuthService.HashPassword("Original#42"),
            ResetOtp = "271643",
            ResetOtpExpiry = DateTime.UtcNow.AddMinutes(-1),
        };
        database.Set<User>().Add(user);
        await database.SaveChangesAsync();

        try
        {
            var verification = new VerifyOtpDto { Email = user.Email, Otp = user.ResetOtp! };
            var reset = new ResetPasswordDto { Email = user.Email, Otp = user.ResetOtp!, NewPassword = "Replacement#42" };
            Assert.False(await auth.VerifyOtpAsync(verification));
            await Assert.ThrowsAsync<BadRequestException>(() => auth.ResetPasswordAsync(reset));

            user.ResetOtpExpiry = DateTime.UtcNow.AddMinutes(5);
            await database.SaveChangesAsync();
            Assert.True(await auth.VerifyOtpAsync(verification));
            using var client = factory.CreateClient();
            using var blank = await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordDto
            {
                Email = user.Email,
                Otp = verification.Otp,
                NewPassword = "        ",
            });
            Assert.Equal(HttpStatusCode.BadRequest, blank.StatusCode);
            Assert.True(await auth.VerifyOtpAsync(verification));

            Assert.True(await auth.ResetPasswordAsync(reset));
            database.ChangeTracker.Clear();
            Assert.False(await auth.VerifyOtpAsync(verification));
            await Assert.ThrowsAsync<BadRequestException>(() => auth.ResetPasswordAsync(reset));

            await Assert.ThrowsAsync<BadRequestException>(() => auth.ChangePasswordAsync(user.Id,
                new ChangePasswordDto { CurrentPassword = "Wrong#42", NewPassword = "Another#42" }));
            await auth.ChangePasswordAsync(user.Id,
                new ChangePasswordDto { CurrentPassword = reset.NewPassword, NewPassword = "Another#42" });
            await Assert.ThrowsAsync<UnauthorizedException>(() => auth.LoginAsync(
                new LoginRequestDto { Email = user.Email, Password = reset.NewPassword }));
            Assert.NotEmpty((await auth.LoginAsync(
                new LoginRequestDto { Email = user.Email, Password = "Another#42" })).Token);
        }
        finally
        {
            database.ChangeTracker.Clear();
            database.Set<User>().Remove(user);
            await database.SaveChangesAsync();
        }
    }
}
