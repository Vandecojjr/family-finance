using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.Categories;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Categories.CreateCategory;

public sealed class CreateCategoryCommandHandler(
    ICategoryRepository categoryRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<CreateCategoryCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(
        CreateCategoryCommand command,
        CancellationToken cancellationToken)
    {
        var currentMember = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (currentMember is null)
        {
            return Result<Guid>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        if (command.ParentId.HasValue)
        {
            var parent = await categoryRepository.GetByIdAsync(command.ParentId.Value, cancellationToken);
            if (parent is null)
            {
                return Result<Guid>.Failure(
                    Error.NotFound("Category.ParentNotFound", $"Categoria pai com ID '{command.ParentId.Value}' não foi encontrada."));
            }

            if (parent.FamilyId != currentMember.FamilyId)
            {
                return Result<Guid>.Failure(
                    Error.Forbidden("Category.AccessDenied", "A categoria pai informada pertence a outra família."));
            }

            if (parent.ParentId.HasValue)
            {
                return Result<Guid>.Failure(
                    Error.Failure("Category.NestingLimitExceeded", "Não é permitido criar subcategorias com mais de um nível de aninhamento."));
            }

            if (parent.Type != command.Type)
            {
                return Result<Guid>.Failure(
                    Error.Failure("Category.TypeMismatch", "A subcategoria deve ter o mesmo tipo (Gasto/Ganho) que a categoria pai."));
            }
        }

        var category = new Category(
            command.Name,
            command.Type,
            currentMember.FamilyId,
            command.ParentId);

        await categoryRepository.AddAsync(category, cancellationToken);

        return Result<Guid>.Success(category.Id);
    }
}
