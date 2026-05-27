using Application.PlannedExpenses.UseCases.Shared;
using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.PlannedExpenses.UseCases.GetPlannedExpenseById;

public sealed class GetPlannedExpenseByIdQueryHandler(
    IPlannedExpenseRepository plannedExpenseRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<GetPlannedExpenseByIdQuery, Result<PlannedExpenseResponse>>
{
    public async ValueTask<Result<PlannedExpenseResponse>> Handle(
        GetPlannedExpenseByIdQuery query,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<PlannedExpenseResponse>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var plannedExpense = await plannedExpenseRepository.GetByIdAsync(query.Id, cancellationToken);
        if (plannedExpense is null)
        {
            return Result<PlannedExpenseResponse>.Failure(
                Error.NotFound("PlannedExpense.NotFound", $"Gasto previsto com ID '{query.Id}' não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(plannedExpense.MemberId, cancellationToken);
        if (targetMember is null || targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result<PlannedExpenseResponse>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar gastos previstos para este membro."));
        }

        return Result<PlannedExpenseResponse>.Success(plannedExpense.ToResponse());
    }
}
