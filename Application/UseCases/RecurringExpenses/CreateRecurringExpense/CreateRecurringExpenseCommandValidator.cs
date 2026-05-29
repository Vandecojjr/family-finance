using FluentValidation;

namespace Application.UseCases.RecurringExpenses.CreateRecurringExpense;

public sealed class CreateRecurringExpenseCommandValidator : AbstractValidator<CreateRecurringExpenseCommand>
{
    public CreateRecurringExpenseCommandValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("A descrição é obrigatória.")
            .MaximumLength(200).WithMessage("A descrição deve ter no máximo 200 caracteres.");

        RuleFor(x => x.Amount)
            .GreaterThanOrEqualTo(0).WithMessage("O valor do gasto recorrente deve ser maior ou igual a zero.");

        RuleFor(x => x.DueDay)
            .InclusiveBetween(1, 31).WithMessage("O dia de vencimento deve estar entre 1 e 31.");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("A data de início é obrigatória.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.EndDate.HasValue)
            .WithMessage("A data de término deve ser posterior ou igual à data de início.");

        RuleFor(x => x.MemberId)
            .NotEmpty().WithMessage("O ID do membro é obrigatório.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("O tipo de gasto recorrente informado é inválido.");

        RuleFor(x => x.Frequency)
            .IsInEnum().WithMessage("A frequência informada é inválida.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("A categoria é obrigatória.");
    }
}

