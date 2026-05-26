using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.RecurringExpenses.UseCases.UpdateRecurringExpense;

public sealed class UpdateRecurringExpenseCommandHandler(
    IRecurringExpenseRepository recurringExpenseRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<UpdateRecurringExpenseCommand, Result>
{
    public async ValueTask<Result> Handle(
        UpdateRecurringExpenseCommand command,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var expense = await recurringExpenseRepository.GetByIdAsync(command.Id, cancellationToken);
        if (expense is null)
        {
            return Result.Failure(
                Error.NotFound("RecurringExpense.NotFound", $"Gasto recorrente com ID '{command.Id}' não foi encontrado."));
        }

        if (expense.Member is null || expense.Member.FamilyId != currentMember.FamilyId)
        {
            return Result.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para editar este gasto recorrente."));
        }

        expense.Update(
            command.Description,
            command.Amount,
            command.Type,
            command.Frequency,
            command.DueDay,
            command.StartDate,
            command.EndDate);

        await recurringExpenseRepository.UpdateAsync(expense, cancellationToken);

        return Result.Success();
    }
}
