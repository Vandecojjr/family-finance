using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Application.Shared.Auth;
using Domain.Entities.Accounts;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Auth;

public sealed class JwtAuthTokenService : IAuthTokenService
{
    private readonly JwtOptions _options;
    private readonly JwtSecurityTokenHandler _handler = new();
    private readonly SigningCredentials _signingCredentials;

    public JwtAuthTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
        if (string.IsNullOrWhiteSpace(_options.SigningKey))
            throw new InvalidOperationException("JwtOptions.SigningKey não configurado.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        _signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    }

    public (string token, DateTime expiresAt) GenerateAccessToken(Account account)
    {
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(_options.AccessTokenMinutes <= 0 ? 15 : _options.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, account.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, account.Username),
            new(JwtRegisteredClaimNames.Email, account.Email),
            new("accountId", account.Id.ToString())
        };

        if (account.MemberId != Guid.Empty)
            claims.Add(new Claim("memberId", account.MemberId.ToString()));

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = string.IsNullOrWhiteSpace(_options.Issuer) ? null : _options.Issuer,
            Audience = string.IsNullOrWhiteSpace(_options.Audience) ? null : _options.Audience,
            NotBefore = now,
            Expires = expires,
            SigningCredentials = _signingCredentials
        };

        var token = _handler.CreateToken(descriptor);
        var jwt = _handler.WriteToken(token);
        return (jwt, expires);
    }

    public (string token, DateTime expiresAt) GenerateRefreshToken()
    {
        var expires = DateTime.UtcNow.AddDays(_options.RefreshTokenDays <= 0 ? 7 : _options.RefreshTokenDays);
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        var token = Convert.ToBase64String(bytes);
        return (token, expires);
    }
}
