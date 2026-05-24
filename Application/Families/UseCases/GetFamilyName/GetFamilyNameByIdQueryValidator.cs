using FluentValidation;

namespace Application.Families.UseCases.GetFamilyName;

public sealed class GetFamilyNameByIdQueryValidator : AbstractValidator<GetFamilyNameByIdQuery>
{
    public GetFamilyNameByIdQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("O ID da família é obrigatório.");
    }
}
