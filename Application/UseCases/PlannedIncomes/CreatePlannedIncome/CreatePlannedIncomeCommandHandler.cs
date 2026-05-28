using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.PlannedIncomes;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.PlannedIncomes.CreatePlannedIncome;

public sealed class CreatePlannedIncomeCommandHandler(
    IPlannedIncomeRepository plannedIncomeRepository,
    IFamilyRepository familyRepository,
    ICategoryRepository categoryRepository,
    ICurrentUser currentUser) : ICommandHandler<CreatePlannedIncomeCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(
        CreatePlannedIncomeCommand command,
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
                Error.Failure("Family.AccessDenied", "Você não tem permissão para adicionar ganhos previstos para este membro."));
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

        var plannedIncome = new PlannedIncome(
            command.Description,
            command.Amount,
            command.Date,
            command.MemberId,
            command.CategoryId);

        await plannedIncomeRepository.AddAsync(plannedIncome, cancellationToken);

        return Result<Guid>.Success(plannedIncome.Id);
    }
}
