using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;
using Domain.Enums;
using Domain.Shared.Exceptions;

namespace Application.UseCases.Transactions.TransferMoney;

public sealed class TransferMoneyCommandHandler(
    IWalletRepository walletRepository,
    ICategoryRepository categoryRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<TransferMoneyCommand, Result<Guid[]>>
{
    public async ValueTask<Result<Guid[]>> Handle(TransferMoneyCommand command, CancellationToken cancellationToken)
    {
        if (command.SourceWalletId == null)
            return Result<Guid[]>.Failure(Error.Validation("Transfer.SourceWalletRequired", "A carteira de origem é obrigatória."));

        if (command.DestinationWalletId == null)
            return Result<Guid[]>.Failure(Error.Validation("Transfer.DestinationWalletRequired", "A carteira de destino é obrigatória."));

        if (command.SourceWalletId == command.DestinationWalletId && command.SourceBankAccountId == command.DestinationBankAccountId)
            return Result<Guid[]>.Failure(Error.Validation("Transfer.SameAccount", "A conta de origem e destino não podem ser as mesmas."));

        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
            return Result<Guid[]>.Failure(Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));

        var category = await categoryRepository.GetByIdAsync(command.CategoryId, cancellationToken);
        if (category is null)
            return Result<Guid[]>.Failure(Error.NotFound("Category.NotFound", $"Categoria com ID '{command.CategoryId}' não foi encontrada."));

        if (category.FamilyId != member.FamilyId)
            return Result<Guid[]>.Failure(Error.Failure("Family.AccessDenied", "Você não tem acesso a esta categoria."));

        var sourceWallet = await walletRepository.GetByIdAsync(command.SourceWalletId.Value, cancellationToken);
        if (sourceWallet == null)
            return Result<Guid[]>.Failure(Error.NotFound("Transfer.SourceNotFound", "Carteira de origem não encontrada."));

        if (sourceWallet.FamilyId != member.FamilyId)
            return Result<Guid[]>.Failure(Error.Failure("Family.AccessDenied", "Você não tem acesso a esta carteira de origem."));

        var destWallet = await walletRepository.GetByIdAsync(command.DestinationWalletId.Value, cancellationToken);
        if (destWallet == null)
            return Result<Guid[]>.Failure(Error.NotFound("Transfer.DestinationNotFound", "Carteira de destino não encontrada."));

        if (destWallet.FamilyId != member.FamilyId)
            return Result<Guid[]>.Failure(Error.Failure("Family.AccessDenied", "Você não tem acesso a esta carteira de destino."));

        Guid sourceTransactionId;
        Guid destTransactionId;

        try
        {
            var (sourceTransaction, _) = sourceWallet.RegisterTransaction(
                description: $"Transferência enviada para {destWallet.Name.Value}",
                amount: command.Amount,
                type: TransactionType.TransferOut,
                date: command.Date,
                categoryId: command.CategoryId,
                bankAccountId: command.SourceBankAccountId,
                creditCardId: null,
                useCredit: false,
                notes: command.Notes
            );

            var (destTransaction, _) = destWallet.RegisterTransaction(
                description: $"Transferência recebida de {sourceWallet.Name.Value}",
                amount: command.Amount,
                type: TransactionType.TransferIn,
                date: command.Date,
                categoryId: command.CategoryId,
                bankAccountId: command.DestinationBankAccountId,
                creditCardId: null,
                useCredit: false,
                notes: command.Notes
            );

            sourceTransactionId = sourceTransaction.Id;
            destTransactionId = destTransaction.Id;
        }
        catch (DomainException ex)
        {
            return Result<Guid[]>.Failure(Error.Validation("Transfer.InvalidOperation", ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return Result<Guid[]>.Failure(Error.Validation("Transfer.InvalidOperation", ex.Message));
        }

        await walletRepository.UpdateAsync(sourceWallet, cancellationToken);
        
        if (sourceWallet.Id != destWallet.Id)
        {
            await walletRepository.UpdateAsync(destWallet, cancellationToken);
        }

        return Result<Guid[]>.Success(new[] { sourceTransactionId, destTransactionId });
    }
}
