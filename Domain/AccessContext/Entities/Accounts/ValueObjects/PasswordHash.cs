using Domain.Shared.Entities;
using Domain.AccessContext.Entities.Accounts.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.ValueObjects;

public sealed record PasswordHash : ValueObject
{
    public string Value { get; }

    private PasswordHash(string value)
    {
        Value = value;
    }

    public static PasswordHash Create(string value)
    {
        if (value is null)
            throw new PasswordHashRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new PasswordHashEmptyException();

        if (value.Length > 500)
            throw new PasswordHashTooLongException();

        return new PasswordHash(value);
    }

    public static implicit operator string(PasswordHash hash) => hash.Value;
}
