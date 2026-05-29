using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.RecurringExpenses.GetTotalFixedExpensesByMember;

public sealed class GetTotalFixedExpensesByMemberQueryHandler(
    IExpenseRepository expenseRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) 
    : IQueryHandler<GetTotalFixedExpensesByMemberQuery, Result<decimal>>
{
    public async ValueTask<Result<decimal>> Handle(
        GetTotalFixedExpensesByMemberQuery query,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<decimal>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var targetMember = await familyRepository.GetMemberByIdAsync(query.MemberId, cancellationToken);
        if (targetMember is null)
        {
            return Result<decimal>.Failure(
                Error.NotFound("Member.NotFound", $"Membro com ID '{query.MemberId}' não foi encontrado."));
        }

        if (targetMember.FamilyId != currentMember.FamilyId)
        {
            return Result<decimal>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar os gastos recorrentes deste membro."));
        }

        var expenses = await expenseRepository.GetAllByMemberAsync(query.MemberId, cancellationToken);
        var total = expenses.Where(x => x.RecurringType == Domain.Enums.RecurringExpenseType.Fixed).Sum(x => x.Amount.Value);

        return Result<decimal>.Success(total);
    }
}

