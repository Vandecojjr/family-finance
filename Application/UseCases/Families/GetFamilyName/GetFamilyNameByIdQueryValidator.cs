using FluentValidation;

namespace Application.UseCases.Families.GetFamilyName;

public sealed class GetFamilyNameByIdQueryValidator : AbstractValidator<GetFamilyNameByIdQuery>
{
    public GetFamilyNameByIdQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("O ID da família é obrigatório.");
    }
}
