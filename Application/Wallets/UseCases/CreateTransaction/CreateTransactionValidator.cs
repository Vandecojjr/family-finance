using Domain.Enums;
using FluentValidation;

namespace Application.Wallets.UseCases.CreateTransaction;

public class CreateTransactionValidator : AbstractValidator<CreateTransactionCommand>
{
    public CreateTransactionValidator()
    {
        RuleFor(x => x.WalletId)
            .NotEmpty()
            .WithMessage("O ID da carteira é obrigatório.");

        RuleFor(x => x.AccountId)
            .NotEmpty()
            .WithMessage("O ID da conta é obrigatório.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("A descrição da transação é obrigatória.")
            .MaximumLength(150);

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("O valor da transação deve ser maior que zero.");

        RuleFor(x => x.Date)
            .NotEmpty()
            .WithMessage("A data da transação é obrigatória.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Tipo de transação inválido.");

        RuleFor(x => x.CategoryId)
            .NotEmpty()
            .WithMessage("O ID da categoria é obrigatório.");

        When(x => x.Type == TransactionType.Transfer, () =>
        {
            RuleFor(x => x.TransferId)
                .NotNull()
                .NotEmpty()
                .WithMessage("O ID da transferência/conta destino é obrigatório para transferências.");
        });
    }
}
