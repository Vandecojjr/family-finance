using Application.Shared.Auth;
using Application.Shared.Errors;
using Application.Shared.Results;
using Domain.Entities.Wallets;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Wallets.CreateWallet;

public sealed class CreateWalletCommandHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<CreateWalletCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreateWalletCommand command, CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
            return Result<Guid>.Failure(CommonsErrors.MemberNotFound);

        var wallet = new Wallet(command.Name, command.InitialCashBalance, member.FamilyId);
        await walletRepository.AddAsync(wallet, cancellationToken);

        return Result<Guid>.Success(wallet.Id);
    }
}

