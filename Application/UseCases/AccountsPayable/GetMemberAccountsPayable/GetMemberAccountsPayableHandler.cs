using Application.Shared.Auth;
using Application.Shared.Objects;
using Application.Shared.Repositories;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.AccountsPayable.GetMemberAccountsPayable;

public sealed class GetMemberAccountsPayableHandler(
    IAccountsPayableRepository repository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : 
    IQueryHandler<GetMemberAccountsPayableQuery, Result<IReadOnlyCollection<AccountsPayableDto>>>
{
    public async ValueTask<Result<IReadOnlyCollection<AccountsPayableDto>>> Handle(GetMemberAccountsPayableQuery query, CancellationToken cancellationToken)
    {
        var memberId = currentUser.MemberId;
        var memberExist = await familyRepository.ExistsMemberByIdAsync(memberId, cancellationToken);
        if (!memberExist)
            return Result<IReadOnlyCollection<AccountsPayableDto>>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));

        var expanses = await repository.GetAllByMember(query.MemberId, query.OnlyDate, cancellationToken);
        return Result<IReadOnlyCollection<AccountsPayableDto>>.Success(expanses);
    }
}
