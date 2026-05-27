using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.RecurringIncomes.UseCases.GetTotalFixedIncomesByMember;

public sealed class GetTotalFixedIncomesByMemberQueryHandler(
    IRecurringIncomeRepository recurringIncomeRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) 
    : IQueryHandler<GetTotalFixedIncomesByMemberQuery, Result<decimal>>
{
    public async ValueTask<Result<decimal>> Handle(
        GetTotalFixedIncomesByMemberQuery query,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<decimal>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(query.MemberId, cancellationToken);
        if (targetMember is null)
        {
            return Result<decimal>.Failure(
                Error.NotFound("Member.NotFound", $"Membro com ID '{query.MemberId}' não foi encontrado."));
        }

        if (targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result<decimal>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar os ganhos recorrentes deste membro."));
        }

        var total = await recurringIncomeRepository.GetTotalFixedIncomesByMemberIdAsync(query.MemberId, cancellationToken);

        return Result<decimal>.Success(total);
    }
}
