using Application.Shared.Results;
using Mediator;

namespace Application.Categories.UseCases.DeleteCategory;

public record DeleteCategoryCommand(Guid Id) : ICommand<Result>;
