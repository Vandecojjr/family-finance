using Application.Shared.Auth;
using Application.Shared.Results;
using Application.UseCases.Wallets.Shared;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Wallets.GetWalletsByFamily;

public sealed class GetWalletsByFamilyQueryHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<GetWalletsByFamilyQuery, Result<IReadOnlyCollection<WalletResponse>>>
{
    public async ValueTask<Result<IReadOnlyCollection<WalletResponse>>> Handle(
        GetWalletsByFamilyQuery query,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result<IReadOnlyCollection<WalletResponse>>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var wallets = await walletRepository.GetByFamilyIdAsync(member.FamilyId, cancellationToken);

        var response = wallets.ToResponse();
        return Result<IReadOnlyCollection<WalletResponse>>.Success(response);
    }
}

