using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.RecurringIncomes.UseCases.DeleteRecurringIncome;

public sealed class DeleteRecurringIncomeCommandHandler(
    IRecurringIncomeRepository recurringIncomeRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<DeleteRecurringIncomeCommand, Result>
{
    public async ValueTask<Result> Handle(
        DeleteRecurringIncomeCommand command,
        CancellationToken cancellationToken)
    {
        var recurringIncome = await recurringIncomeRepository.GetByIdAsync(command.Id, cancellationToken);
        if (recurringIncome is null)
        {
            return Result.Failure(
                Error.NotFound("RecurringIncome.NotFound", $"Ganho recorrente com ID '{command.Id}' não foi encontrado."));
        }

        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(recurringIncome.MemberId, cancellationToken);
        if (targetMember is null || targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para remover ganhos recorrentes deste membro."));
        }

        await recurringIncomeRepository.DeleteAsync(recurringIncome, cancellationToken);

        return Result.Success();
    }
}
