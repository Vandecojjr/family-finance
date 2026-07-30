using FluentValidation;

namespace Application.UseCases.Families.AddMember;

public sealed class AddFamilyMemberCommandValidator : AbstractValidator<AddFamilyMemberCommand>
{
    public AddFamilyMemberCommandValidator()
    {
        RuleFor(x => x.FamilyId)
            .NotEmpty().WithMessage("FamilyId não pode ser vazio.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nome não pode ser vazio.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email não pode ser vazio.")
            .EmailAddress().WithMessage("Email inválido.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Senha não pode ser vazia.")
            .MinimumLength(6).WithMessage("Senha deve ter no mínimo 6 caracteres.");

        RuleFor(x => x.RoleName)
            .NotEmpty().WithMessage("Role não pode ser vazia.")
            .Must(r => r == "Admin" || r == "Member" || r == "Viewer")
            .WithMessage("Role deve ser Admin, Member ou Viewer.");
    }
}
