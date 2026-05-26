using Domain.Shared.Exceptions;

namespace Domain.Entities.Categories.Exceptions;

public class SubCategoryCannotHaveSubCategoriesException : DomainException
{
    public SubCategoryCannotHaveSubCategoriesException() 
        : base("A subcategory cannot have nested subcategories (maximum depth is 1 level).")
    {
    }
}
