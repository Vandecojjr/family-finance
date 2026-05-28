using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.RecurringIncomes;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.RecurringIncomes.CreateRecurringIncome;

public sealed class CreateRecurringIncomeCommandHandler(
    IRecurringIncomeRepository recurringIncomeRepository,
    IFamilyRepository familyRepository,
    ICategoryRepository categoryRepository,
    ICurrentUser currentUser) : ICommandHandler<CreateRecurringIncomeCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(
        CreateRecurringIncomeCommand command,
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
                Error.Failure("Family.AccessDenied", "Você não tem permissão para adicionar ganhos recorrentes para este membro."));
        }

        var category = await categoryRepository.GetByIdAsync(command.CategoryId, cancellationToken);
        if (category is null)
        {
            return Result<Guid>.Failure(
                Error.NotFound("Category.NotFound", $"Categoria com ID '{command.CategoryId}' não foi encontrada."));
        }

        if (category.FamilyId != targetMember.FamilyId)
        {
            return Result<Guid>.Failure(
                Error.Failure("Family.AccessDenied", "A categoria não pertence à mesma família do membro."));
        }

        if (category.Type != Domain.Enums.CategoryType.Income)
        {
            return Result<Guid>.Failure(
                Error.Failure("Category.InvalidType", "A categoria selecionada deve ser do tipo Ganho."));
        }

        var recurringIncome = new RecurringIncome(
            command.Description,
            command.Amount,
            command.Type,
            command.Frequency,
            command.DueDay,
            command.StartDate,
            command.EndDate,
            command.MemberId,
            command.CategoryId);

        await recurringIncomeRepository.AddAsync(recurringIncome, cancellationToken);

        return Result<Guid>.Success(recurringIncome.Id);
    }
}
