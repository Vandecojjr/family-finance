using Domain.Shared.Entities;
using Domain.Entities.Incomes.Exceptions;

namespace Domain.Entities.Incomes.ValueObjects;

public sealed record IncomeDescription : ValueObject
{
    public string Value { get; init; }

    private IncomeDescription(string value) => Value = value;

    public static IncomeDescription Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new IncomeDescriptionRequiredException("A descrição é obrigatória.");

        if (value.Length > 200)
            throw new IncomeDescriptionTooLongException("A descrição não pode exceder 200 caracteres.");

        return new IncomeDescription(value.Trim());
    }
}
