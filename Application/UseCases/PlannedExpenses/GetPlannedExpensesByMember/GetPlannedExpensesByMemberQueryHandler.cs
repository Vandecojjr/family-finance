using Application.Shared.Auth;
using Application.Shared.Results;
using Application.UseCases.PlannedExpenses.Shared;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.PlannedExpenses.GetPlannedExpensesByMember;

public sealed class GetPlannedExpensesByMemberQueryHandler(
    IExpenseRepository expenseRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<GetPlannedExpensesByMemberQuery, Result<IReadOnlyCollection<PlannedExpenseResponse>>>
{
    public async ValueTask<Result<IReadOnlyCollection<PlannedExpenseResponse>>> Handle(
        GetPlannedExpensesByMemberQuery query,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember == null)
            return Result<IReadOnlyCollection<PlannedExpenseResponse>>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));

        if (currentUser.MemberId != query.MemberId)
        {
            var requestedMember = await familyRepository.GetMemberByIdAsync(query.MemberId, cancellationToken);
            if (requestedMember == null || requestedMember.FamilyId != currentMember.FamilyId)
            {
                return Result<IReadOnlyCollection<PlannedExpenseResponse>>.Failure(
                    Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar gastos previstos para este membro."));
            }
        }

        var plannedExpenses = await expenseRepository.GetAllPlannedByMemberAsync(query.MemberId, cancellationToken);
        return Result<IReadOnlyCollection<PlannedExpenseResponse>>.Success(plannedExpenses.ToResponse());
    }
}

