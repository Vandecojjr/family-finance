using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.Incomes;
using Domain.Enums;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.PlannedIncomes.CreatePlannedIncome;

public sealed class CreatePlannedIncomeCommandHandler(
    IIncomeRepository incomeRepository,
    IFamilyRepository familyRepository,
    ICategoryRepository categoryRepository,
    ICurrentUser currentUser) : ICommandHandler<CreatePlannedIncomeCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(
        CreatePlannedIncomeCommand command,
        CancellationToken cancellationToken)
    {
        var memberExist = await familyRepository.ExistsMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (!memberExist)
            return Result<Guid>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));

        if (command.MemberId != currentUser.MemberId)
            return Result<Guid>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para adicionar ganhos previstos para este membro."));

        var category = await categoryRepository.GetByIdAsync(command.CategoryId, cancellationToken);
        if (category is null)
            return Result<Guid>.Failure(
                Error.NotFound("Category.NotFound", $"Categoria com ID '{command.CategoryId}' não foi encontrada."));

        if (category.Type != CategoryType.Income)
            return Result<Guid>.Failure(
                Error.Failure("Category.InvalidType", "A categoria selecionada deve ser do tipo Ganho."));

        var plannedIncome = Income.CreatePlanned(
            command.Description,
            command.Amount,
            command.Date,
            command.MemberId,
            command.CategoryId);

        await incomeRepository.AddAsync(plannedIncome, cancellationToken);

        return Result<Guid>.Success(plannedIncome.Id);
    }
}
