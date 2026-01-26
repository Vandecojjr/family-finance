using Domain.Repositories;
using FluentValidation;

namespace Application.Accounts.UseCases.CreateAccount;

public sealed class CreateAccountValidator : AbstractValidator<CreateAccountCommand>
{
    public CreateAccountValidator(IAccountRepository accountRepository)
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(50)
            .MustAsync(async (username, ct) => !await accountRepository.ExistsByUsernameAsync(username, ct))
            .WithMessage("Username já está em uso.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MustAsync(async (email, ct) => !await accountRepository.ExistsByEmailAsync(email, ct))
            .WithMessage("Email já está em uso.");

        RuleFor(x => x.PasswordHash)
            .NotEmpty();
    }
}
