using FluentValidation;

namespace Application.Wallets.UseCases.CreatePersonalWallet;

public class CreatePersonalWalletValidator : AbstractValidator<CreatePersonalWalletCommand>
{
    public CreatePersonalWalletValidator()
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
