using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.PlannedIncomes.DeletePlannedIncome;

public sealed class DeletePlannedIncomeCommandHandler(
    IPlannedIncomeRepository plannedIncomeRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<DeletePlannedIncomeCommand, Result>
{
    public async ValueTask<Result> Handle(
        DeletePlannedIncomeCommand command,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var plannedIncome = await plannedIncomeRepository.GetByIdAsync(command.Id, cancellationToken);
        if (plannedIncome is null)
        {
            return Result.Failure(
                Error.NotFound("PlannedIncome.NotFound", $"Ganho previsto com ID '{command.Id}' não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(plannedIncome.MemberId, cancellationToken);
        if (targetMember is null || targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para remover ganhos previstos para este membro."));
        }

        await plannedIncomeRepository.DeleteAsync(plannedIncome, cancellationToken);

        return Result.Success();
    }
}
