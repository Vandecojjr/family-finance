using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.RecurringExpenses.UseCases.UpdateRecurringExpense;

public sealed class UpdateRecurringExpenseCommandHandler(
    IRecurringExpenseRepository recurringExpenseRepository,
    IFamilyRepository familyRepository,
    ICategoryRepository categoryRepository,
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

        var category = await categoryRepository.GetByIdAsync(command.CategoryId, cancellationToken);
        if (category is null)
        {
            return Result.Failure(
                Error.NotFound("Category.NotFound", $"Categoria com ID '{command.CategoryId}' não foi encontrada."));
        }

        if (category.FamilyId != currentMember.FamilyId)
        {
            return Result.Failure(
                Error.Failure("Family.AccessDenied", "A categoria não pertence à mesma família do membro."));
        }

        if (category.Type != Domain.Enums.CategoryType.Expense)
        {
            return Result.Failure(
                Error.Failure("Category.InvalidType", "A categoria selecionada deve ser do tipo Gasto."));
        }

        expense.Update(
            command.Description,
            command.Amount,
            command.Type,
            command.Frequency,
            command.DueDay,
            command.StartDate,
            command.EndDate,
            command.CategoryId);

        await recurringExpenseRepository.UpdateAsync(expense, cancellationToken);

        return Result.Success();
    }
}
