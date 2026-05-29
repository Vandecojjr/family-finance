using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.RecurringIncomes.UpdateRecurringIncome;

public sealed class UpdateRecurringIncomeCommandHandler(
    IRecurringIncomeRepository recurringIncomeRepository,
    IFamilyRepository familyRepository,
    ICategoryRepository categoryRepository,
    ICurrentUser currentUser) : ICommandHandler<UpdateRecurringIncomeCommand, Result>
{
    public async ValueTask<Result> Handle(
        UpdateRecurringIncomeCommand command,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var income = await recurringIncomeRepository.GetByIdAsync(command.Id, cancellationToken);
        if (income is null)
        {
            return Result.Failure(
                Error.NotFound("RecurringIncome.NotFound", $"Ganho recorrente com ID '{command.Id}' não foi encontrado."));
        }

        if (income.Member is null || income.Member.FamilyId != currentMember.FamilyId)
        {
            return Result.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para editar este ganho recorrente."));
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

        if (category.Type != Domain.Enums.CategoryType.Income)
        {
            return Result.Failure(
                Error.Failure("Category.InvalidType", "A categoria selecionada deve ser do tipo Ganho."));
        }

        income.Update(
            command.Description,
            command.Amount,
            command.Type,
            command.Frequency,
            command.DueDay,
            command.StartDate,
            command.EndDate,
            command.CategoryId);

        await recurringIncomeRepository.UpdateAsync(income, cancellationToken);

        return Result.Success();
    }
}

