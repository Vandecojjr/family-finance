using Domain.Enums;
using FluentValidation;

namespace Application.Wallets.UseCases.CreateAccount;

public class CreateAccountValidator : AbstractValidator<CreateAccountCommand>
{
    public CreateAccountValidator()
    {
        When(x => x.Type == AccountType.Credit, () =>
        {
            RuleFor(x => x.CreditLimit)
                .NotNull()
                .WithMessage("Contas de crédito requerem limite, dia de fechamento e dia de vencimento.")
                .WithErrorCode("INVALID_CREDIT_ACCOUNT");

            RuleFor(x => x.ClosingDay)
                .NotNull()
                .WithMessage("Contas de crédito requerem limite, dia de fechamento e dia de vencimento.")
                .WithErrorCode("INVALID_CREDIT_ACCOUNT");

            RuleFor(x => x.DueDay)
                .NotNull()
                .WithMessage("Contas de crédito requerem limite, dia de fechamento e dia de vencimento.")
                .WithErrorCode("INVALID_CREDIT_ACCOUNT");
        });
    }
}
