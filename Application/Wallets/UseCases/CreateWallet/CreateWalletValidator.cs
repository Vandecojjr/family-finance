using FluentValidation;

namespace Application.Wallets.UseCases.CreateWallet;

public class CreateWalletValidator : AbstractValidator<CreateWalletCommand>
{
    public CreateWalletValidator()
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
