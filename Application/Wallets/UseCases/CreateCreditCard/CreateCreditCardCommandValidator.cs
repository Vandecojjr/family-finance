using FluentValidation;

namespace Application.Wallets.UseCases.CreateCreditCard;

public sealed class CreateCreditCardCommandValidator : AbstractValidator<CreateCreditCardCommand>
{
    public CreateCreditCardCommandValidator()
    {
        RuleFor(x => x.WalletId)
            .NotEmpty().WithMessage("O ID da carteira é obrigatório.");

        RuleFor(x => x.AccountId)
            .NotEmpty().WithMessage("O ID da conta é obrigatório.");

        RuleFor(x => x.Brand)
            .NotEmpty().WithMessage("A bandeira do cartão é obrigatória.")
            .MaximumLength(50).WithMessage("A bandeira do cartão deve ter no máximo 50 caracteres.");

        RuleFor(x => x.LastFourDigits)
            .NotEmpty().WithMessage("Os 4 últimos dígitos do cartão são obrigatórios.")
            .Length(4).WithMessage("Os 4 últimos dígitos do cartão devem ter exatamente 4 caracteres.")
            .Matches("^[0-9]+$").WithMessage("Os 4 últimos dígitos do cartão devem ser numéricos.");

        RuleFor(x => x.TotalLimit)
            .GreaterThanOrEqualTo(0).WithMessage("O limite total do cartão deve ser maior ou igual a zero.");
    }
}
