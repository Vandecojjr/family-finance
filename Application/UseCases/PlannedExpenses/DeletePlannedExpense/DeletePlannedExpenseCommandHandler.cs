using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.PlannedExpenses.DeletePlannedExpense;

public sealed class DeletePlannedExpenseCommandHandler(
    IExpenseRepository expenseRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<DeletePlannedExpenseCommand, Result>
{
    public async ValueTask<Result> Handle(
        DeletePlannedExpenseCommand command,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var plannedExpense = await expenseRepository.GetByIdAsync(command.Id, cancellationToken);
        if (plannedExpense is null)
        {
            return Result.Failure(
                Error.NotFound("Expense.NotFound", $"Gasto previsto com ID '{command.Id}' não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(plannedExpense.MemberId, cancellationToken);
        if (targetMember is null || targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para remover gastos previstos para este membro."));
        }

        await expenseRepository.DeleteAsync(plannedExpense, cancellationToken);

        return Result.Success();
    }
}

