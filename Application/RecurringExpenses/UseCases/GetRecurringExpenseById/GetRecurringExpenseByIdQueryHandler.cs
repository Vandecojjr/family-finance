using Application.RecurringExpenses.UseCases.Shared;
using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.RecurringExpenses.UseCases.GetRecurringExpenseById;

public sealed class GetRecurringExpenseByIdQueryHandler(
    IRecurringExpenseRepository recurringExpenseRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<GetRecurringExpenseByIdQuery, Result<RecurringExpenseResponse>>
{
    public async ValueTask<Result<RecurringExpenseResponse>> Handle(
        GetRecurringExpenseByIdQuery query,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<RecurringExpenseResponse>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var expense = await recurringExpenseRepository.GetByIdAsync(query.Id, cancellationToken);
        if (expense is null)
        {
            return Result<RecurringExpenseResponse>.Failure(
                Error.NotFound("RecurringExpense.NotFound", $"Gasto recorrente com ID '{query.Id}' não foi encontrado."));
        }

        if (expense.Member is null || expense.Member.FamilyId != currentMember.FamilyId)
        {
            return Result<RecurringExpenseResponse>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar este gasto recorrente."));
        }

        return Result<RecurringExpenseResponse>.Success(expense.ToResponse());
    }
}
