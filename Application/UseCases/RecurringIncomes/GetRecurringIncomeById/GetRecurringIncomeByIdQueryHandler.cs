using Application.Shared.Auth;
using Application.Shared.Results;
using Application.UseCases.RecurringIncomes.Shared;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.RecurringIncomes.GetRecurringIncomeById;

public sealed class GetRecurringIncomeByIdQueryHandler(
    IRecurringIncomeRepository recurringIncomeRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<GetRecurringIncomeByIdQuery, Result<RecurringIncomeResponse>>
{
    public async ValueTask<Result<RecurringIncomeResponse>> Handle(
        GetRecurringIncomeByIdQuery query,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<RecurringIncomeResponse>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var income = await recurringIncomeRepository.GetByIdAsync(query.Id, cancellationToken);
        if (income is null)
        {
            return Result<RecurringIncomeResponse>.Failure(
                Error.NotFound("RecurringIncome.NotFound", $"Ganho recorrente com ID '{query.Id}' não foi encontrado."));
        }

        if (income.Member is null || income.Member.FamilyId != currentMember.FamilyId)
        {
            return Result<RecurringIncomeResponse>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar este ganho recorrente."));
        }

        return Result<RecurringIncomeResponse>.Success(income.ToResponse());
    }
}

