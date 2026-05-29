using FluentValidation;

namespace Application.UseCases.RecurringExpenses.PayRecurringExpense;

public sealed class PayRecurringExpenseCommandValidator : AbstractValidator<PayRecurringExpenseCommand>
{
    public PayRecurringExpenseCommandValidator()
    {
        RuleFor(x => x.RecurringExpenseId)
            .NotEmpty().WithMessage("O ID do gasto recorrente é obrigatório.");

        RuleFor(x => x.WalletId)
            .NotEmpty().WithMessage("O ID da carteira é obrigatório.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("O valor pago deve ser maior que zero.");
    }
}

