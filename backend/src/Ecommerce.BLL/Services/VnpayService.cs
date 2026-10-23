using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Ecommerce.Common.Entities;
using Microsoft.Extensions.Configuration;

namespace Ecommerce.BLL.Services;

public interface IVnpayService
{
    string CreatePaymentUrl(Order order, string clientIp, string returnUrl);
    bool ValidateCallback(IDictionary<string, string> queryParams);
}

public class VnpayService : IVnpayService
{
    private readonly IConfiguration _configuration;

    public VnpayService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CreatePaymentUrl(Order order, string clientIp, string returnUrl)
    {
        var tmnCode = _configuration["Vnpay:TmnCode"] ?? "AETHEL01";
        var hashSecret = _configuration["Vnpay:HashSecret"] ?? "AETHELGARDSECRETKEY2026VNPAYSANDBOX999";
        var baseUrl = _configuration["Vnpay:BaseUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

        var vnpData = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            { "vnp_Version", "2.1.0" },
            { "vnp_Command", "pay" },
            { "vnp_TmnCode", tmnCode },
            { "vnp_Amount", ((long)(order.TotalAmount * 100)).ToString(CultureInfo.InvariantCulture) },
            { "vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss") },
            { "vnp_CurrCode", "VND" },
            { "vnp_IpAddr", string.IsNullOrWhiteSpace(clientIp) ? "127.0.0.1" : clientIp },
            { "vnp_Locale", "vn" },
            { "vnp_OrderInfo", $"Thanh toan don hang {order.OrderCode} tai Aethelgard Mall" },
            { "vnp_OrderType", "other" },
            { "vnp_ReturnUrl", returnUrl },
            { "vnp_TxnRef", order.Id.ToString() }
        };

        var queryBuilder = new StringBuilder();
        var hashDataBuilder = new StringBuilder();

        foreach (var (key, value) in vnpData)
        {
            if (string.IsNullOrEmpty(value)) continue;

            if (queryBuilder.Length > 0)
            {
                queryBuilder.Append('&');
                hashDataBuilder.Append('&');
            }

            var encodedKey = WebUtility.UrlEncode(key);
            var encodedValue = WebUtility.UrlEncode(value);

            queryBuilder.Append($"{encodedKey}={encodedValue}");
            hashDataBuilder.Append($"{encodedKey}={encodedValue}");
        }

        var secureHash = HmacSha512(hashSecret, hashDataBuilder.ToString());
        queryBuilder.Append($"&vnp_SecureHash={secureHash}");

        return $"{baseUrl}?{queryBuilder}";
    }

    public bool ValidateCallback(IDictionary<string, string> queryParams)
    {
        var hashSecret = _configuration["Vnpay:HashSecret"] ?? "AETHELGARDSECRETKEY2026VNPAYSANDBOX999";

        if (!queryParams.TryGetValue("vnp_SecureHash", out var receivedHash) || string.IsNullOrWhiteSpace(receivedHash))
        {
            return false;
        }

        var sortedData = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var (key, value) in queryParams)
        {
            if (key.StartsWith("vnp_", StringComparison.OrdinalIgnoreCase) &&
                !key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase) &&
                !key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
            {
                sortedData.Add(key, value);
            }
        }

        var hashDataBuilder = new StringBuilder();
        foreach (var (key, value) in sortedData)
        {
            if (string.IsNullOrEmpty(value)) continue;

            if (hashDataBuilder.Length > 0)
                hashDataBuilder.Append('&');

            hashDataBuilder.Append($"{WebUtility.UrlEncode(key)}={WebUtility.UrlEncode(value)}");
        }

        var computedHash = HmacSha512(hashSecret, hashDataBuilder.ToString());
        return computedHash.Equals(receivedHash, StringComparison.OrdinalIgnoreCase);
    }

    private static string HmacSha512(string key, string data)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new HMACSHA512(keyBytes);
        var hash = hmac.ComputeHash(dataBytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
