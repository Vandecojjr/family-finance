using Application.Shared.Validation;
using Domain.Repositories;
using FluentValidation;

namespace Application.Accounts.UseCases.Register;

public sealed class RegisterAccountValidator : AbstractValidator<RegisterAccountCommand>
{
    public RegisterAccountValidator(IAccountRepository accountRepository, IFamilyRepository familyRepository)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("O nome é obrigatório.")
            .MaximumLength(100).WithMessage("O nome deve ter no máximo 100 caracteres.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("O e-mail é obrigatório.")
            .EmailAddress().WithMessage("O e-mail informado é inválido.")
            .MustAsync(async (email, ct) => !await accountRepository.ExistsByEmailAsync(email, ct))
            .WithMessage("Este e-mail já está em uso.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("A senha é obrigatória.")
            .MinimumLength(6).WithMessage("A senha deve ter no mínimo 6 caracteres.");

        RuleFor(x => x.FamilyName)
            .NotEmpty().WithMessage("O nome da família é obrigatório.")
            .MaximumLength(100).WithMessage("O nome da família deve ter no máximo 100 caracteres.")
            .MustAsync(async (name, ct) => !await familyRepository.ExistsByNameAsync(name, ct))
            .WithMessage("Já existe uma família com este nome.");

        RuleFor(x => x.Document)
            .NotEmpty().WithMessage("O CPF é obrigatório.")
            .MustBeCpf();
    }
}
