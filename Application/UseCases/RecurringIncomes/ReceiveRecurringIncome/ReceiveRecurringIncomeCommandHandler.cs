using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.Transactions;
using Domain.Repositories;
using Domain.Services;
using Mediator;

using Application.Shared.Providers;

namespace Application.UseCases.RecurringIncomes.ReceiveRecurringIncome;

public sealed class ReceiveRecurringIncomeCommandHandler(
    IIncomeRepository incomeRepository,
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser,
    IncomePaymentService incomePaymentService) : ICommandHandler<ReceiveRecurringIncomeCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(
        ReceiveRecurringIncomeCommand command,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result<Guid>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var recurringIncome = await incomeRepository.GetByIdAsync(command.RecurringIncomeId, cancellationToken);
        if (recurringIncome is null)
        {
            return Result<Guid>.Failure(
                Error.NotFound("Income.NotFound", $"Receita recorrente com ID '{command.RecurringIncomeId}' não foi encontrada."));
        }

        if (recurringIncome.Member.FamilyId != member.FamilyId)
        {
            return Result<Guid>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem acesso a esta receita recorrente."));
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
                Error.Failure("Family.AccessDenied", "Você não tem acesso a esta carteira."));
        }

        Transaction transaction;
        try
        {
            var result = incomePaymentService.ProcessPayment(
                recurringIncome,
                wallet,
                command.Amount,
                DateTime.UtcNow,
                command.BankAccountId);
            
            transaction = result.Transaction;
        }
        catch (Exception ex)
        {
            return Result<Guid>.Failure(Error.Validation("RecurringIncome.PaymentError", ex.Message));
        }

        await walletRepository.UpdateAsync(wallet, cancellationToken);
        await incomeRepository.UpdateAsync(recurringIncome, cancellationToken);

        return Result<Guid>.Success(transaction.Id);
    }
}
