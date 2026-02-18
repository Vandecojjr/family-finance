using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.Categories.UseCases.UpdateCategory;

public sealed class UpdateCategoryHandler(
    ICategoryRepository categoryRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser
) : ICommandHandler<UpdateCategoryCommand, Result>
{
    public async ValueTask<Result> Handle(UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetByIdAsyncWithSubCategories(command.Id, cancellationToken);
        if (category is null)
            return Result.Failure(Error.NotFound("CATEGORY_NOT_FOUND", "Categoria não encontrada."));

        var family = await familyRepository.GetByMemberIdAsync(currentUser.AccountId, cancellationToken);
        if (family is null)
            return Result.Failure(Error.NotFound("FAMILY_NOT_FOUND", "Família não encontrada."));

        if (category.FamilyId != family.Id)
            return Result.Failure(Error.Failure("CATEGORY_FORBIDDEN",
                "Você só pode atualizar categorias da sua própria família. Categorias do sistema não podem ser alteradas."));

        if (command.ParentId.HasValue)
        {
            if (command.ParentId == category.Id)
                return Result.Failure(Error.Failure("INVALID_CATEGORY_PARENT", "Uma categoria não pode ser pai de si mesma."));

            var parent = await categoryRepository.GetByIdAsyncWithSubCategories(command.ParentId.Value, cancellationToken);
            if (parent is null)
                return Result.Failure(Error.NotFound("CATEGORY_PARENT_NOT_FOUND", "Categoria pai não encontrada."));
        }

        category.Update(command.Name, command.Type, command.ParentId);

        await categoryRepository.UpdateAsync(category, cancellationToken);

        return Result.Success();
    }
}
