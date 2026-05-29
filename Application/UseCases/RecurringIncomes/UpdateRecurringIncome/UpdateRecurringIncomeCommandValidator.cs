using FluentValidation;

namespace Application.UseCases.RecurringIncomes.UpdateRecurringIncome;

public sealed class UpdateRecurringIncomeCommandValidator : AbstractValidator<UpdateRecurringIncomeCommand>
{
    public UpdateRecurringIncomeCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("O ID do ganho recorrente é obrigatório.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("A descrição é obrigatória.")
            .MaximumLength(200).WithMessage("A descrição deve ter no máximo 200 caracteres.");

        RuleFor(x => x.Amount)
            .GreaterThanOrEqualTo(0).WithMessage("O valor do ganho recorrente deve ser maior ou igual a zero.");

        RuleFor(x => x.DueDay)
            .Must(day => (day >= 1 && day <= 31) || (day >= 101 && day <= 131))
            .WithMessage("O dia de entrada deve estar entre 1 e 31 ou entre 101 e 131 para dias úteis.");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("A data de início é obrigatória.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.EndDate.HasValue)
            .WithMessage("A data de término deve ser posterior ou igual à data de início.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("O tipo de ganho recorrente informado é inválido.");

        RuleFor(x => x.Frequency)
            .IsInEnum().WithMessage("A frequência informada é inválida.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("A categoria é obrigatória.");
    }
}

