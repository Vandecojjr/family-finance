using FluentValidation;

namespace Application.Families.UseCases.GetFamilyById;

public sealed class GetFamilyByIdQueryValidator : AbstractValidator<GetFamilyByIdQuery>
{
    public GetFamilyByIdQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("O ID da família é obrigatório.");
    }
}
