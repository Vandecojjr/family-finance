using Domain.Shared.Entities;
using Domain.Entities.Members.Exceptions;

namespace Domain.Entities.Members.ValueObjects;

public sealed record MemberName : ValueObject
{
    public string Value { get; init; }

    private MemberName(string value)
    {
        Value = value;
    }

    public static MemberName Create(string value)
    {
        if (value is null)
            throw new MemberNameRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new MemberNameEmptyException();

        if (value.Length > 100)
            throw new MemberNameTooLongException();

        return new MemberName(value);
    }
}
