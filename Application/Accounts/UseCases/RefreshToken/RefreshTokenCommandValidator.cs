using FluentValidation;

namespace Application.Accounts.UseCases.RefreshToken;

public sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.AccountId)
            .NotEmpty().WithMessage("AccountId é obrigatório.");

        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("RefreshToken é obrigatório.")
            .MinimumLength(16).WithMessage("RefreshToken inválido.");
    }
}
