using Application.Shared.Auth;
using Application.Shared.Results;
using Application.UseCases.RecurringIncomes.Shared;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.RecurringIncomes.GetRecurringIncomesByMember;

public sealed class GetRecurringIncomesByMemberQueryHandler(
    IIncomeRepository incomeRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) 
    : IQueryHandler<GetRecurringIncomesByMemberQuery, Result<IReadOnlyCollection<RecurringIncomeResponse>>>
{
    public async ValueTask<Result<IReadOnlyCollection<RecurringIncomeResponse>>> Handle(
        GetRecurringIncomesByMemberQuery query,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<IReadOnlyCollection<RecurringIncomeResponse>>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(query.MemberId, cancellationToken);
        if (targetMember is null)
        {
            return Result<IReadOnlyCollection<RecurringIncomeResponse>>.Failure(
                Error.NotFound("Member.NotFound", $"Membro com ID '{query.MemberId}' não foi encontrado."));
        }

        if (targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result<IReadOnlyCollection<RecurringIncomeResponse>>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar os ganhos recorrentes deste membro."));
        }

        var incomes = await incomeRepository.GetRecurringByMemberIdAsync(query.MemberId, cancellationToken);

        return Result<IReadOnlyCollection<RecurringIncomeResponse>>.Success(incomes.ToResponse());
    }
}
