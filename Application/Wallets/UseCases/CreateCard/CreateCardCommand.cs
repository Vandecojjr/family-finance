using Application.Shared.Results;
using Mediator;

namespace Application.Wallets.UseCases.CreateCard;

public record CreateCardCommand(
    Guid AccountId,
    string Name,
    decimal Limit,
    int ClosingDay,
    int DueDay
) : ICommand<Result<Guid>>;
