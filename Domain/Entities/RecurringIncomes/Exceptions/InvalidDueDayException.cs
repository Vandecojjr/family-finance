using Domain.Shared.Exceptions;

namespace Domain.Entities.RecurringIncomes.Exceptions;

public class InvalidDueDayException : DomainException
{
    public InvalidDueDayException() 
        : base("O dia de entrada do ganho recorrente deve estar entre 1 e 31 ou entre 101 e 131 para dias úteis.")
    {
    }
}
