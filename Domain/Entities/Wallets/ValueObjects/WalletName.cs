using Domain.Shared.Entities;
using Domain.Entities.Wallets.Exceptions;

namespace Domain.Entities.Wallets.ValueObjects;

public sealed record WalletName : ValueObject
{
    public string Value { get; }

    private WalletName(string value)
    {
        Value = value;
    }

    public static WalletName Create(string value)
    {
        if (value is null)
            throw new WalletNameRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new WalletNameRequiredException();

        if (value.Length > 100)
            throw new WalletNameTooLongException();

        return new WalletName(value.Trim());
    }
}
