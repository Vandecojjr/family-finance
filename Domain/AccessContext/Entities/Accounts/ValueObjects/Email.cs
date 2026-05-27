using System.Text.RegularExpressions;
using Domain.Shared.Entities;
using Domain.AccessContext.Entities.Accounts.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.ValueObjects;

public sealed partial record Email : ValueObject
{
    public string Value { get; }

    private Email(string value)
    {
        Value = value;
    }

    public static Email Create(string value)
    {
        if (value is null)
            throw new EmailRequiredException();

        var trimmed = value.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(trimmed))
            throw new EmailEmptyException();

        if (trimmed.Length > 256)
            throw new EmailTooLongException();

        if (!EmailRegex().IsMatch(trimmed))
            throw new EmailInvalidException();

        return new Email(trimmed);
    }

    public static implicit operator string(Email email) => email.Value;

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled)]
    private static partial Regex EmailRegex();
}
