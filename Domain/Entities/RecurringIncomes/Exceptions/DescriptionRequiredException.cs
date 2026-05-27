using Domain.Shared.Exceptions;

namespace Domain.Entities.RecurringIncomes.Exceptions;

public class DescriptionRequiredException : DomainException
{
    public DescriptionRequiredException() 
        : base("A descrição do ganho recorrente é obrigatória.")
    {
    }
}
