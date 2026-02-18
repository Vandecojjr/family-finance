using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.Categories.UseCases.DeleteCategory;

public sealed class DeleteCategoryHandler(
    ICategoryRepository categoryRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser
) : ICommandHandler<DeleteCategoryCommand, Result>
{
    public async ValueTask<Result> Handle(DeleteCategoryCommand command, CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetByIdAsyncWithSubCategories(command.Id, cancellationToken);
        if (category is null)
            return Result.Failure(Error.NotFound("CATEGORY_NOT_FOUND", "Categoria não encontrada."));

        var family = await familyRepository.GetByMemberIdAsync(currentUser.AccountId, cancellationToken);
        if (family is null)
            return Result.Failure(Error.NotFound("FAMILY_NOT_FOUND", "Família não encontrada."));

        if (category.FamilyId != family.Id)
            return Result.Failure(Error.Failure("CATEGORY_FORBIDDEN", "Você só pode excluir suas próprias categorias."));

        if (category.SubCategories.Any())
            return Result.Failure(Error.Failure("CATEGORY_HAS_SUBCATEGORIES", "Não é possível excluir uma categoria que possui subcategorias."));

        await categoryRepository.RemoveAsync(category, cancellationToken);

        return Result.Success();
    }
}
