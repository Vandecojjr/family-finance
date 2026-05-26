using Domain.Shared.Exceptions;

namespace Domain.Entities.Categories.Exceptions;

public class CategoryNameRequiredException : DomainException
{
    public CategoryNameRequiredException() 
        : base("Category name is required and cannot be null.")
    {
    }
}
