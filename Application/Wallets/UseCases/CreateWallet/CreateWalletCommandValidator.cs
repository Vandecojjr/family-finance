using FluentValidation;

namespace Application.Wallets.UseCases.CreateWallet;

public sealed class CreateWalletCommandValidator : AbstractValidator<CreateWalletCommand>
{
    public CreateWalletCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("O nome da carteira é obrigatório.")
            .MaximumLength(100).WithMessage("O nome da carteira deve ter no máximo 100 caracteres.");

        RuleFor(x => x.CashBalance)
            .GreaterThanOrEqualTo(0).WithMessage("O saldo em dinheiro vivo deve ser maior ou igual a zero.");
    }
}
