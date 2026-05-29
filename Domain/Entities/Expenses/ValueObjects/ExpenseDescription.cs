using Domain.Shared.Entities;
using Domain.Entities.Expenses.Exceptions;

namespace Domain.Entities.Expenses.ValueObjects;

public sealed record ExpenseDescription : ValueObject
{
    public string Value { get; init; }

    private ExpenseDescription(string value) => Value = value;

    public static ExpenseDescription Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ExpenseDescriptionRequiredException("A descrição é obrigatória.");

        if (value.Length > 200)
            throw new ExpenseDescriptionTooLongException("A descrição não pode exceder 200 caracteres.");

        return new ExpenseDescription(value.Trim());
    }
}
