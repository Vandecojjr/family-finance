using Domain.Shared.Aggregates.Abstractions;

namespace Domain.Shared.Repositories;

public interface IRepository<TAggregate> where TAggregate : IAggregateRoot;