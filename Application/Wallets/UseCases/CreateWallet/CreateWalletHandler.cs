using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.Wallets;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.CreateWallet;

public sealed class CreateWalletHandler(
    IWalletRepository walletRepository,
    ICurrentUser currentUser
) : ICommandHandler<CreateWalletCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreateWalletCommand command, CancellationToken cancellationToken)
    {
        var wallet = Wallet.CreatePersonal(command.Name, currentUser.MemberId);
        await walletRepository.AddAsync(wallet, cancellationToken);
        return Result<Guid>.Success(wallet.Id);
    }
}
