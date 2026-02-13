using Application.Wallets.UseCases.CreatePersonalWallet;
using FluentValidation;

namespace Application.Wallets.UseCases.CreateFamilyWallet;

public class CreateFamilyWalletValidator : AbstractValidator<CreatePersonalWalletCommand>
{
    public CreateFamilyWalletValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(80);

        RuleFor(x => x.Type)
            .IsInEnum();
            
        RuleFor(x => x.InitialBalance)
            .GreaterThanOrEqualTo(0);
    }
}
