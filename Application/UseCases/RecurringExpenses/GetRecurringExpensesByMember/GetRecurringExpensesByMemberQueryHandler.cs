using Application.Shared.Auth;
using Application.Shared.Results;
using Application.UseCases.RecurringExpenses.Shared;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.RecurringExpenses.GetRecurringExpensesByMember;

public sealed class GetRecurringExpensesByMemberQueryHandler(
    IExpenseRepository expenseRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) 
    : IQueryHandler<GetRecurringExpensesByMemberQuery, Result<IReadOnlyCollection<RecurringExpenseResponse>>>
{
    public async ValueTask<Result<IReadOnlyCollection<RecurringExpenseResponse>>> Handle(
        GetRecurringExpensesByMemberQuery query,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.ExistsMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (!currentMember)
            return Result<IReadOnlyCollection<RecurringExpenseResponse>>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));

        if (query.MemberId != currentUser.MemberId)
            return Result<IReadOnlyCollection<RecurringExpenseResponse>>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar os gastos recorrentes deste membro."));

        var expenses = await expenseRepository.GetAllRecurringByMemberAsync(query.MemberId, cancellationToken);
        return Result<IReadOnlyCollection<RecurringExpenseResponse>>.Success(expenses.ToResponse());
    }
}

