using Application.Shared.Auth;
using Application.Shared.Results;
using Application.UseCases.PlannedIncomes.Shared;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.PlannedIncomes.GetPlannedIncomesByMember;

public sealed class GetPlannedIncomesByMemberQueryHandler(
    IPlannedIncomeRepository plannedIncomeRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<GetPlannedIncomesByMemberQuery, Result<IReadOnlyCollection<PlannedIncomeResponse>>>
{
    public async ValueTask<Result<IReadOnlyCollection<PlannedIncomeResponse>>> Handle(
        GetPlannedIncomesByMemberQuery query,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<IReadOnlyCollection<PlannedIncomeResponse>>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(query.MemberId, cancellationToken);
        if (targetMember is null)
        {
            return Result<IReadOnlyCollection<PlannedIncomeResponse>>.Failure(
                Error.NotFound("Member.NotFound", $"Membro com ID '{query.MemberId}' não foi encontrado."));
        }

        if (targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result<IReadOnlyCollection<PlannedIncomeResponse>>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar ganhos previstos para este membro."));
        }

        var plannedIncomes = await plannedIncomeRepository.GetByMemberIdAsync(query.MemberId, cancellationToken);

        return Result<IReadOnlyCollection<PlannedIncomeResponse>>.Success(plannedIncomes.ToResponse());
    }
}
