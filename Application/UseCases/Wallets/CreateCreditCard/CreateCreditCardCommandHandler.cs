using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Domain.Services;
using Mediator;

namespace Application.UseCases.Wallets.CreateCreditCard;

public sealed class CreateCreditCardCommandHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser,
    ICreditCardCreationService creditCardCreationService) : ICommandHandler<CreateCreditCardCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(
        CreateCreditCardCommand command,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result<Guid>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var wallet = await walletRepository.GetByIdAsync(command.WalletId, cancellationToken);
        if (wallet is null)
        {
            return Result<Guid>.Failure(
                Error.NotFound("Wallet.NotFound", $"Carteira com ID '{command.WalletId}' não foi encontrada."));
        }

        if (wallet.FamilyId != member.FamilyId)
        {
            return Result<Guid>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para gerenciar esta carteira."));
        }

        var account = wallet.Accounts.FirstOrDefault(a => a.Id == command.AccountId);
        if (account is null)
        {
            return Result<Guid>.Failure(
                Error.NotFound("BankAccount.NotFound", $"Conta com ID '{command.AccountId}' não foi encontrada nesta carteira."));
        }

        var initialInvoices = command.Invoices?
            .Select(i => (i.DueDate, i.Amount))
            .ToList();

        var cardId = await creditCardCreationService.CreateCreditCardWithInvoicesAsync(
            wallet,
            command.AccountId,
            command.Brand,
            command.LastFourDigits,
            command.TotalLimit,
            command.AvailableLimit,
            command.DueDay,
            command.CategoryId,
            member.Id,
            initialInvoices,
            cancellationToken);

        return Result<Guid>.Success(cardId);
    }
}

