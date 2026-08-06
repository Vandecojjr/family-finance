using FluentValidation;

namespace Application.UseCases.Families.UpdateTimezone;

internal sealed class UpdateFamilyTimezoneCommandValidator : AbstractValidator<UpdateFamilyTimezoneCommand>
{
    public UpdateFamilyTimezoneCommandValidator()
    {
        RuleFor(x => x.FamilyId)
            .NotEmpty()
            .WithMessage("O ID da família é obrigatório.");

        RuleFor(x => x.Timezone)
            .NotEmpty()
            .WithMessage("O fuso horário é obrigatório.")
            .MaximumLength(100)
            .WithMessage("O fuso horário não pode ter mais de 100 caracteres.");
    }
}
