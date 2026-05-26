using Domain.Shared.Exceptions;

namespace Domain.Entities.Categories.Exceptions;

public class CategoryNameTooLongException : DomainException
{
    public CategoryNameTooLongException() 
        : base("Category name exceeds the maximum length of 100 characters.")
    {
    }
}
