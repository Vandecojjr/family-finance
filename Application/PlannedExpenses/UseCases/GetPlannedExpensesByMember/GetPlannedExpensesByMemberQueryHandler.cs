using Application.PlannedExpenses.UseCases.Shared;
using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.PlannedExpenses.UseCases.GetPlannedExpensesByMember;

public sealed class GetPlannedExpensesByMemberQueryHandler(
    IPlannedExpenseRepository plannedExpenseRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<GetPlannedExpensesByMemberQuery, Result<IReadOnlyCollection<PlannedExpenseResponse>>>
{
    public async ValueTask<Result<IReadOnlyCollection<PlannedExpenseResponse>>> Handle(
        GetPlannedExpensesByMemberQuery query,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<IReadOnlyCollection<PlannedExpenseResponse>>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(query.MemberId, cancellationToken);
        if (targetMember is null)
        {
            return Result<IReadOnlyCollection<PlannedExpenseResponse>>.Failure(
                Error.NotFound("Member.NotFound", $"Membro com ID '{query.MemberId}' não foi encontrado."));
        }

        if (targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result<IReadOnlyCollection<PlannedExpenseResponse>>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar gastos previstos para este membro."));
        }

        var plannedExpenses = await plannedExpenseRepository.GetByMemberIdAsync(query.MemberId, cancellationToken);

        return Result<IReadOnlyCollection<PlannedExpenseResponse>>.Success(plannedExpenses.ToResponse());
    }
}
