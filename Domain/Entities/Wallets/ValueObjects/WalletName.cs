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
        if (string.IsNullOrWhiteSpace(value) || string.IsNullOrEmpty(value))
            throw new WalletNameRequiredException();

        if (value.Length > 100)
            throw new WalletNameTooLongException();

        return new WalletName(value.Trim());
    }
    
    public static implicit operator string(WalletName walletName) => walletName.Value;
}
