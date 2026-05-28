using Domain.Entities.CreidtCards.Exceptions;
using Domain.Shared.Entities;

namespace Domain.Entities.CreidtCards.ValueObjects;

public sealed record LastFourDigits : ValueObject
{
    public string Value { get; }

    private LastFourDigits(string value)
    {
        Value = value;
    }

    public static LastFourDigits Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length != 4 || !int.TryParse(value, out _))
            throw new InvalidLastFourDigitsException();

        return new LastFourDigits(value);
    }
}
