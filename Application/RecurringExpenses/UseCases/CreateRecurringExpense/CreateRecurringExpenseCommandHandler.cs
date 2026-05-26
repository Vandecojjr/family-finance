using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.RecurringExpenses;
using Domain.Repositories;
using Mediator;

namespace Application.RecurringExpenses.UseCases.CreateRecurringExpense;

public sealed class CreateRecurringExpenseCommandHandler(
    IRecurringExpenseRepository recurringExpenseRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<CreateRecurringExpenseCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(
        CreateRecurringExpenseCommand command,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<Guid>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(command.MemberId, cancellationToken);
        if (targetMember is null)
        {
            return Result<Guid>.Failure(
                Error.NotFound("Member.NotFound", $"Membro com ID '{command.MemberId}' não foi encontrado."));
        }

        if (targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result<Guid>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para adicionar gastos recorrentes para este membro."));
        }

        var recurringExpense = new RecurringExpense(
            command.Description,
            command.Amount,
            command.Type,
            command.Frequency,
            command.DueDay,
            command.StartDate,
            command.EndDate,
            command.MemberId);

        await recurringExpenseRepository.AddAsync(recurringExpense, cancellationToken);

        return Result<Guid>.Success(recurringExpense.Id);
    }
}
