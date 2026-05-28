using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.RecurringExpenses.DeleteRecurringExpense;

public sealed class DeleteRecurringExpenseCommandHandler(
    IRecurringExpenseRepository recurringExpenseRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<DeleteRecurringExpenseCommand, Result>
{
    public async ValueTask<Result> Handle(
        DeleteRecurringExpenseCommand command,
        CancellationToken cancellationToken)
    {
        var recurringExpense = await recurringExpenseRepository.GetByIdAsync(command.Id, cancellationToken);
        if (recurringExpense is null)
        {
            return Result.Failure(
                Error.NotFound("RecurringExpense.NotFound", $"Gasto recorrente com ID '{command.Id}' não foi encontrado."));
        }

        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(recurringExpense.MemberId, cancellationToken);
        if (targetMember is null || targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para remover gastos recorrentes deste membro."));
        }

        await recurringExpenseRepository.DeleteAsync(recurringExpense, cancellationToken);

        return Result.Success();
    }
}
