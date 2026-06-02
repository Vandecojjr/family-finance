using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.Incomes;
using Domain.Enums;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.RecurringIncomes.CreateRecurringIncome;

public sealed class CreateRecurringIncomeCommandHandler(
    IIncomeRepository incomeRepository,
    IFamilyRepository familyRepository,
    ICategoryRepository categoryRepository,
    ICurrentUser currentUser) : ICommandHandler<CreateRecurringIncomeCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(
        CreateRecurringIncomeCommand command,
        CancellationToken cancellationToken)
    {
        var memberExist = await familyRepository.ExistsMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (!memberExist)
            return Result<Guid>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));

        if (command.MemberId != currentUser.MemberId)
            return Result<Guid>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para adicionar ganhos recorrentes para este membro."));

        var category = await categoryRepository.GetByIdAsync(command.CategoryId, cancellationToken);
        if (category is null)
            return Result<Guid>.Failure(
                Error.NotFound("Category.NotFound", $"Categoria com ID '{command.CategoryId}' não foi encontrada."));

        if (category.Type != CategoryType.Income)
        {
            return Result<Guid>.Failure(
                Error.Failure("Category.InvalidType", "A categoria selecionada deve ser do tipo Ganho."));
        }

        var recurringIncome = Income.CreateRecurring(
            command.Description,
            command.Amount,
            command.Type,
            command.Frequency,
            command.DueDay,
            command.StartDate,
            command.EndDate,
            command.MemberId,
            command.CategoryId);

        await incomeRepository.AddAsync(recurringIncome, cancellationToken);

        return Result<Guid>.Success(recurringIncome.Id);
    }
}
