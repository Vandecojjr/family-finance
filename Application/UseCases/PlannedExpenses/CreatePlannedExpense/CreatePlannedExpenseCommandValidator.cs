using FluentValidation;

namespace Application.UseCases.PlannedExpenses.CreatePlannedExpense;

public sealed class CreatePlannedExpenseCommandValidator : AbstractValidator<CreatePlannedExpenseCommand>
{
    public CreatePlannedExpenseCommandValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("A descrição é obrigatória.")
            .MaximumLength(200).WithMessage("A descrição deve ter no máximo 200 caracteres.");

        RuleFor(x => x.Amount)
            .GreaterThanOrEqualTo(0).WithMessage("O valor do gasto previsto deve ser maior ou igual a zero.");

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("A data prevista é obrigatória.");

        RuleFor(x => x.MemberId)
            .NotEmpty().WithMessage("O ID do membro é obrigatório.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("A categoria é obrigatória.");
    }
}

