using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.PlannedIncomes.UpdatePlannedIncome;

public sealed class UpdatePlannedIncomeCommandHandler(
    IPlannedIncomeRepository plannedIncomeRepository,
    IFamilyRepository familyRepository,
    ICategoryRepository categoryRepository,
    ICurrentUser currentUser) : ICommandHandler<UpdatePlannedIncomeCommand, Result>
{
    public async ValueTask<Result> Handle(
        UpdatePlannedIncomeCommand command,
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
                Error.Failure("Family.AccessDenied", "Você não tem permissão para alterar ganhos previstos para este membro."));
        }

        var category = await categoryRepository.GetByIdAsync(command.CategoryId, cancellationToken);
        if (category is null)
        {
            return Result.Failure(
                Error.NotFound("Category.NotFound", $"Categoria com ID '{command.CategoryId}' não foi encontrada."));
        }

        if (category.FamilyId != targetMember.FamilyId)
        {
            return Result.Failure(
                Error.Failure("Family.AccessDenied", "A categoria não pertence à mesma família do membro."));
        }

        if (category.Type != Domain.Enums.CategoryType.Income)
        {
            return Result.Failure(
                Error.Failure("Category.InvalidType", "A categoria selecionada deve ser do tipo Ganho."));
        }

        plannedIncome.Update(
            command.Description,
            command.Amount,
            command.Date,
            command.CategoryId);

        await plannedIncomeRepository.UpdateAsync(plannedIncome, cancellationToken);

        return Result.Success();
    }
}

