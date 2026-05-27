using Domain.Shared.Entities;
using Domain.AccessContext.Entities.Accounts.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.ValueObjects;

public sealed record RefreshTokenValue : ValueObject
{
    public string Value { get; }

    private RefreshTokenValue(string value)
    {
        Value = value;
    }

    public static RefreshTokenValue Create(string value)
    {
        if (value is null)
            throw new RefreshTokenValueRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new RefreshTokenValueEmptyException();

        if (value.Length > 500)
            throw new RefreshTokenValueTooLongException();

        return new RefreshTokenValue(value);
    }

    public static implicit operator string(RefreshTokenValue token) => token.Value;
}
