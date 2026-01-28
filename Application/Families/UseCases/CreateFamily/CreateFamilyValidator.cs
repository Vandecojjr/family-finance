using Domain.Repositories;
using FluentValidation;

namespace Application.Families.UseCases.CreateFamily;

public sealed class CreateFamilyValidator : AbstractValidator<CreateFamilyCommand>
{
    public CreateFamilyValidator(IFamilyRepository familyRepository)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("O nome da família é obrigatório.")
            .MaximumLength(100).WithMessage("O nome da família deve ter no máximo 100 caracteres.")
            .MustAsync(async (name, ct) => !await familyRepository.ExistsByNameAsync(name, ct))
            .WithMessage("Já existe uma família com este nome.");
    }
}
