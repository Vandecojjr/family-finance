using FluentValidation;

namespace Application.UseCases.Families.GetFamilyById;

public sealed class GetFamilyByIdQueryValidator : AbstractValidator<GetFamilyByIdQuery>
{
    public GetFamilyByIdQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("O ID da família é obrigatório.");
    }
}
