using Application.Shared.Auth;
using Application.Shared.Objects;
using Application.Shared.Repositories;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.AccountsReceivable.GetMemberAccountsReceivable;

public sealed class GetMemberAccountsReceivableHandler(
    IAccountsReceivableRepository repository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : 
    IQueryHandler<GetMemberAccountsReceivableQuery, Result<IReadOnlyCollection<AccountsReceivableDto>>>
{
    public async ValueTask<Result<IReadOnlyCollection<AccountsReceivableDto>>> Handle(GetMemberAccountsReceivableQuery query, CancellationToken cancellationToken)
    {
        var memberId = currentUser.MemberId;
        var familyId = await familyRepository.GetFamilyIdByMemberIdAsync(memberId, cancellationToken);
        if (familyId == Guid.Empty)
            return Result<IReadOnlyCollection<AccountsReceivableDto>>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));

        var incomes = await repository.GetAllByFamily(familyId, query.OnlyDate, cancellationToken);
        return Result<IReadOnlyCollection<AccountsReceivableDto>>.Success(incomes);
    }
}
