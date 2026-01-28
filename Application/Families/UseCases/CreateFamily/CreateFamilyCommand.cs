using Application.Shared.Results;
using Mediator;

namespace Application.Families.UseCases.CreateFamily;

public sealed record CreateFamilyCommand(string Name) : ICommand<Result<Guid>>;
