using Application.Shared.Results;
using Domain.Entities.Categories;
using Domain.Repositories;
using Mediator;

namespace Application.Categories.UseCases.CreateCategory;

public sealed class CreateCategoryHandler(
    ICategoryRepository categoryRepository
) : ICommandHandler<CreateCategoryCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        var category = new Category(command.Name, command.Type, command.FamilyId, command.ParentId);
        
        if (command.ParentId.HasValue)
        {
            var parent = await categoryRepository.GetByIdAsyncWithSubCategories(command.ParentId.Value, cancellationToken);
            if (parent is null)
                return Result<Guid>.Failure(Error.NotFound("CATEGORY_PARENT_NOT_FOUND", "Categoria pai não encontrada."));

            if (parent.FamilyId != command.FamilyId)
                return Result<Guid>.Failure(Error.Failure("INVALID_CATEGORY_PARENT", "A categoria pai não pertence à família atual."));
            
            parent.AddSubCategory(category);
            await categoryRepository.UpdateAsync(parent, cancellationToken);
        }

        var existWithName = await categoryRepository.ExistParentCategoryByNameAsync(category.Name, category.FamilyId, cancellationToken);
        if (existWithName)
            return Result<Guid>.Failure(Error.Conflict("CATEGORY_ALREADY_EXISTS", "Já existe uma categoria com o mesmo nome."));

        await categoryRepository.AddAsync(category, cancellationToken);
        return Result<Guid>.Success(category.Id);
    }
}
