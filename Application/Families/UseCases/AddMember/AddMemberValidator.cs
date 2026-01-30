using Application.Shared.Validation;
using Domain.Repositories;
using FluentValidation;

namespace Application.Families.UseCases.AddMember;

public sealed class AddMemberValidator : AbstractValidator<AddMemberCommand>
{
    public AddMemberValidator(IFamilyRepository familyRepository)
    {
        RuleFor(x => x.FamilyId)
            .NotEmpty();

        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(200);

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Document)
            .NotEmpty()
            .MustBeCpf()
            .MustAsync(async (cmd, document, ct) =>
            {
                var exists = await familyRepository.ExistsMemberByDocumentAsync(cmd.FamilyId, document, ct);
                return !exists;
            })
            .WithMessage("CPF já cadastrado para a família.");
    }
}
