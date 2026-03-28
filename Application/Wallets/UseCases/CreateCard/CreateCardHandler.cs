using Application.Shared.Results;
using Domain.Entities.Wallets;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.CreateCard;

public sealed class CreateCardHandler(IWalletRepository walletRepository) : ICommandHandler<CreateCardCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreateCardCommand command, CancellationToken cancellationToken)
    {
        var wallet = await walletRepository.GetByAccountIdAsync(command.AccountId, cancellationToken);
        var account = wallet?.Accounts.FirstOrDefault(a => a.Id == command.AccountId);

        if (wallet == null || account == null)
            return Result<Guid>.Failure(Error.NotFound("ACCOUNT_NOT_FOUND", "Conta não encontrada."));

        if (account.Cards.Count > 0)
            return Result<Guid>.Failure(Error.Conflict("ACCOUNT_ALREADY_HAS_CARD", "Esta conta já possui um cartão cadastrado."));

        var card = new Card(command.Name, command.Limit, command.ClosingDay, command.DueDay, command.AccountId);
        account.AddCard(card);

        await walletRepository.UpdateAsync(wallet, cancellationToken);

        return Result<Guid>.Success(card.Id);
    }
}
