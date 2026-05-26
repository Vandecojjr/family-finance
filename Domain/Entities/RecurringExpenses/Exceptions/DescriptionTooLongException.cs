using Domain.Shared.Exceptions;

namespace Domain.Entities.RecurringExpenses.Exceptions;

public class DescriptionTooLongException : DomainException
{
    public DescriptionTooLongException() 
        : base("A descrição do gasto recorrente não pode exceder 200 caracteres.")
    {
    }
}
