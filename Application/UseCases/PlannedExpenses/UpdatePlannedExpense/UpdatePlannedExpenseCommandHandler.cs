using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.PlannedExpenses.UpdatePlannedExpense;

public sealed class UpdatePlannedExpenseCommandHandler(
    IExpenseRepository expenseRepository,
    IFamilyRepository familyRepository,
    ICategoryRepository categoryRepository,
    ICurrentUser currentUser) : ICommandHandler<UpdatePlannedExpenseCommand, Result>
{
    public async ValueTask<Result> Handle(
        UpdatePlannedExpenseCommand command,
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
                Error.Failure("Family.AccessDenied", "Você não tem permissão para alterar gastos previstos para este membro."));
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

        if (category.Type != Domain.Enums.CategoryType.Expense)
        {
            return Result.Failure(
                Error.Failure("Category.InvalidType", "A categoria selecionada deve ser do tipo Gasto."));
        }

        plannedExpense.UpdatePlanned(
            command.Description,
            command.Amount,
            command.Date,
            command.CategoryId);

        await expenseRepository.UpdateAsync(plannedExpense, cancellationToken);

        return Result.Success();
    }
}

