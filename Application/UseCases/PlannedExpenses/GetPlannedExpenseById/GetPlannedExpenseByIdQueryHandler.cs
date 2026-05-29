using Application.Shared.Auth;
using Application.Shared.Results;
using Application.UseCases.PlannedExpenses.Shared;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.PlannedExpenses.GetPlannedExpenseById;

public sealed class GetPlannedExpenseByIdQueryHandler(
    IExpenseRepository expenseRepository,
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

        var plannedExpense = await expenseRepository.GetByIdAsync(query.Id, cancellationToken);
        if (plannedExpense is null)
        {
            return Result<PlannedExpenseResponse>.Failure(
                Error.NotFound("Expense.NotFound", $"Gasto previsto com ID '{query.Id}' não foi encontrado."));
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

