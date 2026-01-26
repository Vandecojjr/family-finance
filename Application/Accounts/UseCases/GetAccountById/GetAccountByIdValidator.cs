using FluentValidation;

namespace Application.Accounts.UseCases.GetAccountById;

public sealed class GetAccountByIdValidator : AbstractValidator<GetAccountByIdQuery>
{
    public GetAccountByIdValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}
