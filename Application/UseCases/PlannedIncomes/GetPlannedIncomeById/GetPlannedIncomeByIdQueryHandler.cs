using Application.Shared.Auth;
using Application.Shared.Results;
using Application.UseCases.PlannedIncomes.Shared;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.PlannedIncomes.GetPlannedIncomeById;

public sealed class GetPlannedIncomeByIdQueryHandler(
    IIncomeRepository incomeRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<GetPlannedIncomeByIdQuery, Result<PlannedIncomeResponse>>
{
    public async ValueTask<Result<PlannedIncomeResponse>> Handle(
        GetPlannedIncomeByIdQuery query,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<PlannedIncomeResponse>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var plannedIncome = await incomeRepository.GetByIdAsync(query.Id, cancellationToken);
        if (plannedIncome is null)
        {
            return Result<PlannedIncomeResponse>.Failure(
                Error.NotFound("PlannedIncome.NotFound", $"Ganho previsto com ID '{query.Id}' não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(plannedIncome.MemberId, cancellationToken);
        if (targetMember is null || targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result<PlannedIncomeResponse>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar ganhos previstos para este membro."));
        }

        return Result<PlannedIncomeResponse>.Success(plannedIncome.ToResponse());
    }
}
