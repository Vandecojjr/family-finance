using Application.Shared.Auth;
using Application.Shared.Results;
using Application.Wallets.UseCases.Shared;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.GetWalletsByFamily;

public sealed class GetWalletsByFamilyQueryHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<GetWalletsByFamilyQuery, Result<List<WalletResponse>>>
{
    public async ValueTask<Result<List<WalletResponse>>> Handle(
        GetWalletsByFamilyQuery query,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result<List<WalletResponse>>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var wallets = await walletRepository.GetByFamilyIdAsync(member.FamilyId, cancellationToken);

        var response = wallets.Select(w => new WalletResponse(
            w.Id,
            w.Name.Value,
            w.CashBalance.Value,
            w.FamilyId,
            w.Accounts.Select(a => new BankAccountResponse(
                a.Id,
                a.BankName.Value,
                (int)a.Type,
                a.DebitBalance,
                a.CreditLimit.Value,
                a.CreditCards.Select(c => new CreditCardResponse(
                    c.Id,
                    c.Brand.Value,
                    c.LastFourDigits.Value,
                    c.TotalLimit.Value
                )).ToList()
            )).ToList()
        )).ToList();

        return Result<List<WalletResponse>>.Success(response);
    }
}
