using FluentValidation;

namespace Application.UseCases.Wallets.UpdateBankAccount;

public sealed class UpdateBankAccountCommandValidator : AbstractValidator<UpdateBankAccountCommand>
{
    public UpdateBankAccountCommandValidator()
    {
        RuleFor(x => x.WalletId)
            .NotEmpty().WithMessage("O ID da carteira é obrigatório.");

        RuleFor(x => x.AccountId)
            .NotEmpty().WithMessage("O ID da conta é obrigatório.");

        RuleFor(x => x.BankName)
            .NotEmpty().WithMessage("O nome do banco é obrigatório.")
            .MaximumLength(100).WithMessage("O nome do banco deve ter no máximo 100 caracteres.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("O tipo de conta selecionado é inválido.");

        RuleFor(x => x.CreditLimit)
            .GreaterThanOrEqualTo(0).WithMessage("O limite de crédito deve ser maior ou igual a zero.");
    }
}
