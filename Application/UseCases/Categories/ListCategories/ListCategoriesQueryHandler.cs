using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Categories.ListCategories;

public sealed class ListCategoriesQueryHandler(
    ICategoryRepository categoryRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<ListCategoriesQuery, Result<IReadOnlyCollection<CategoryResponse>>>
{
    public async ValueTask<Result<IReadOnlyCollection<CategoryResponse>>> Handle(
        ListCategoriesQuery query,
        CancellationToken cancellationToken)
    {
        // 1. Obter o membro do usuário logado
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<IReadOnlyCollection<CategoryResponse>>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        // 2. Buscar todas as categorias daquela família
        var categories = await categoryRepository.GetByFamilyIdAsync(currentMember.FamilyId, cancellationToken);

        // 3. Montar a hierarquia e retornar
        var response = categories.MapToHierarchy();

        return Result<IReadOnlyCollection<CategoryResponse>>.Success(response);
    }
}
