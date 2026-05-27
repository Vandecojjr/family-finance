using Domain.Shared.Exceptions;

namespace Domain.Entities.RecurringIncomes.Exceptions;

public class DescriptionTooLongException : DomainException
{
    public DescriptionTooLongException() 
        : base("A descrição do ganho recorrente deve ter no máximo 200 caracteres.")
    {
    }
}
