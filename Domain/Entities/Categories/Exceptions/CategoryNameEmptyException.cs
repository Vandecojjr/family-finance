using Domain.Shared.Exceptions;

namespace Domain.Entities.Categories.Exceptions;

public class CategoryNameEmptyException : DomainException
{
    public CategoryNameEmptyException() 
        : base("Category name cannot be empty or whitespace.")
    {
    }
}
