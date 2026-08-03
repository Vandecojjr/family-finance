using FluentValidation;

namespace Application.UseCases.Wallets.CreateCreditCard;

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

        RuleFor(x => x.AvailableLimit)
            .GreaterThanOrEqualTo(0).WithMessage("O limite disponível do cartão deve ser maior ou igual a zero.")
            .Must((command, availableLimit) => availableLimit <= command.TotalLimit)
            .WithMessage("O limite disponível não pode ser maior que o limite total.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("A categoria para as faturas de cartão é obrigatória.");

        RuleFor(x => x.Invoices)
            .Must((command, invoices) => 
            {
                var usedLimit = command.TotalLimit - command.AvailableLimit;
                if (usedLimit > 0)
                {
                    if (invoices == null || !invoices.Any()) return false;
                    return invoices.Sum(i => i.Amount) == usedLimit;
                }
                return invoices == null || !invoices.Any();
            })
            .WithMessage(x => 
            {
                var usedLimit = x.TotalLimit - x.AvailableLimit;
                if (usedLimit > 0) return $"Como existe um limite comprometido de {usedLimit:C}, você deve informar faturas cuja soma dê exatamente este valor.";
                return "Não devem ser informadas faturas iniciais quando o limite disponível é igual ao total.";
            });

        RuleForEach(x => x.Invoices).ChildRules(invoice =>
        {
            invoice.RuleFor(i => i.DueDate)
                .NotEmpty().WithMessage("A data de vencimento da fatura é obrigatória.");
            invoice.RuleFor(i => i.Amount)
                .GreaterThan(0).WithMessage("O valor da fatura deve ser maior que zero.");
        });
    }
}

