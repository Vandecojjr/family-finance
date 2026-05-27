using Domain.Shared.Exceptions;

namespace Domain.Entities.RecurringIncomes.Exceptions;

public class InvalidAmountException : DomainException
{
    public InvalidAmountException() 
        : base("O valor do ganho recorrente deve ser maior ou igual a zero.")
    {
    }
}
