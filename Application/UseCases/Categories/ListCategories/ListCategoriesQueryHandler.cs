using Application.Shared.Auth;
using Application.Shared.Errors;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Categories.ListCategories;

public sealed class ListCategoriesQueryHandler(
    ICategoryRepository categoryRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<ListCategoriesQuery, Result<IReadOnlyCollection<CategoryResponse>>>
{
    public async ValueTask<Result<IReadOnlyCollection<CategoryResponse>>> Handle(ListCategoriesQuery query, CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
            return Result<IReadOnlyCollection<CategoryResponse>>.Failure(CommonsErrors.MemberNotFound);

        var categories = await categoryRepository.GetByFamilyIdAsync(currentMember.FamilyId, cancellationToken);
        var response = categories.ToResponse();

        return Result<IReadOnlyCollection<CategoryResponse>>.Success(response);
    }
}

