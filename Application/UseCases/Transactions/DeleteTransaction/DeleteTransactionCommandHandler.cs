using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Transactions.DeleteTransaction;

public sealed class DeleteTransactionCommandHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<DeleteTransactionCommand, Result>
{
    public async ValueTask<Result> Handle(
        DeleteTransactionCommand command,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var transaction = await walletRepository.GetTransactionByIdAsync(command.Id, cancellationToken);
        if (transaction is null)
        {
            return Result.Failure(
                Error.NotFound("Transaction.NotFound", $"Transação com ID '{command.Id}' não foi encontrada."));
        }

        if (transaction.FamilyId != member.FamilyId)
        {
            return Result.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem acesso a esta transação."));
        }

        return Result.Failure(
            Error.Validation("Transaction.CannotBeDeleted", "Transações pertencem a uma Wallet e nunca podem ser deletadas."));
    }
}

