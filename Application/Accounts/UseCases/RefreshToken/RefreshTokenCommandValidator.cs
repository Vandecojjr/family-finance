using FluentValidation;

namespace Application.Accounts.UseCases.RefreshToken;

internal sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("O refresh token é obrigatório.");
    }
}
