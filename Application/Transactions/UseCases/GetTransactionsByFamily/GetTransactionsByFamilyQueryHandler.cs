using Application.Shared.Auth;
using Application.Shared.Results;
using Application.Transactions.UseCases.Shared;
using Domain.Repositories;
using Mediator;

namespace Application.Transactions.UseCases.GetTransactionsByFamily;

public sealed class GetTransactionsByFamilyQueryHandler(
    ITransactionRepository transactionRepository,
    ICategoryRepository categoryRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<GetTransactionsByFamilyQuery, Result<List<TransactionResponse>>>
{
    public async ValueTask<Result<List<TransactionResponse>>> Handle(
        GetTransactionsByFamilyQuery query,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result<List<TransactionResponse>>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var transactions = await transactionRepository.GetByFamilyIdAsync(member.FamilyId, cancellationToken);
        var categories = await categoryRepository.GetByFamilyIdAsync(member.FamilyId, cancellationToken);
        var categoryDict = categories.ToDictionary(c => c.Id, c => c.Name.Value);

        var responseList = transactions.Select(t => new TransactionResponse(
            t.Id,
            t.Description.Value,
            t.Amount.Value,
            (int)t.Type,
            t.Date,
            t.FamilyId,
            t.CategoryId,
            categoryDict.TryGetValue(t.CategoryId, out var catName) ? catName : "Sem Categoria",
            t.WalletId,
            t.BankAccountId,
            t.CreditCardId,
            t.WalletName,
            t.BankAccountName,
            t.CreditCardDisplayName,
            t.Notes)).ToList();

        return Result<List<TransactionResponse>>.Success(responseList);
    }
}
