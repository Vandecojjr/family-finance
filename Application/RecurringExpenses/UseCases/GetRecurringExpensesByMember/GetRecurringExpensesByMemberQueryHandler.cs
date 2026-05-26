using Application.RecurringExpenses.UseCases.Shared;
using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.RecurringExpenses.UseCases.GetRecurringExpensesByMember;

public sealed class GetRecurringExpensesByMemberQueryHandler(
    IRecurringExpenseRepository recurringExpenseRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) 
    : IQueryHandler<GetRecurringExpensesByMemberQuery, Result<IReadOnlyCollection<RecurringExpenseResponse>>>
{
    public async ValueTask<Result<IReadOnlyCollection<RecurringExpenseResponse>>> Handle(
        GetRecurringExpensesByMemberQuery query,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<IReadOnlyCollection<RecurringExpenseResponse>>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(query.MemberId, cancellationToken);
        if (targetMember is null)
        {
            return Result<IReadOnlyCollection<RecurringExpenseResponse>>.Failure(
                Error.NotFound("Member.NotFound", $"Membro com ID '{query.MemberId}' não foi encontrado."));
        }

        if (targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result<IReadOnlyCollection<RecurringExpenseResponse>>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar os gastos recorrentes deste membro."));
        }

        var expenses = await recurringExpenseRepository.GetByMemberIdAsync(query.MemberId, cancellationToken);

        return Result<IReadOnlyCollection<RecurringExpenseResponse>>.Success(expenses.ToResponse());
    }
}
