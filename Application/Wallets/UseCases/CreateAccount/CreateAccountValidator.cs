using Domain.Enums;
using FluentValidation;

namespace Application.Wallets.UseCases.CreateAccount;

public class CreateAccountValidator : AbstractValidator<CreateAccountCommand>
{
    public CreateAccountValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(80);

        When(x => x.IsCredit, () =>
        {
            RuleFor(x => x.PreApprovedCreditLimit)
                .GreaterThanOrEqualTo(0)
                .WithMessage("O limite pré-aprovado deve ser maior ou igual a zero.")
                .WithErrorCode("INVALID_PRE_APPROVED_LIMIT");
        });

        RuleFor(x => x.InitialBalance)
            .GreaterThanOrEqualTo(0)
            .WithMessage("O saldo inicial deve ser maior ou igual a zero.");
    }
}
