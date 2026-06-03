using FluentValidation;

namespace Application.UseCases.RecurringIncomes.ReceiveRecurringIncome;

public sealed class ReceiveRecurringIncomeCommandValidator : AbstractValidator<ReceiveRecurringIncomeCommand>
{
    public ReceiveRecurringIncomeCommandValidator()
    {
        RuleFor(x => x.RecurringIncomeId)
            .NotEmpty().WithMessage("O ID da receita recorrente é obrigatório.");

        RuleFor(x => x.WalletId)
            .NotEmpty().WithMessage("O ID da carteira é obrigatório.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("O valor recebido deve ser maior que zero.");
    }
}
