using FluentValidation;

namespace Application.UseCases.Accounts.RevokeToken;

internal sealed class RevokeTokenCommandValidator : AbstractValidator<RevokeTokenCommand>
{
    public RevokeTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("O refresh token é obrigatório.");
    }
}
