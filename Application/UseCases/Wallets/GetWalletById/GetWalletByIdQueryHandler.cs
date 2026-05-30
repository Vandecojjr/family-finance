using Application.Shared.Auth;
using Application.Shared.Results;
using Application.UseCases.Wallets.Shared;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Wallets.GetWalletById;

public sealed class GetWalletByIdQueryHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : IQueryHandler<GetWalletByIdQuery, Result<WalletResponse>>
{
    public async ValueTask<Result<WalletResponse>> Handle(
        GetWalletByIdQuery query,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result<WalletResponse>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var wallet = await walletRepository.GetByIdAsync(query.Id, cancellationToken);
        if (wallet is null)
        {
            return Result<WalletResponse>.Failure(
                Error.NotFound("Wallet.NotFound", $"Carteira com ID '{query.Id}' não foi encontrada."));
        }

        if (wallet.FamilyId != member.FamilyId)
        {
            return Result<WalletResponse>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para visualizar esta carteira."));
        }

        var response = wallet.ToResponse();

        return Result<WalletResponse>.Success(response);
    }
}

