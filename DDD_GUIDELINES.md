# Domain-Driven Design (DDD) & Development Guidelines

This document outlines the architectural rules and coding standards that must be followed when creating or modifying domain entities, value objects, exceptions, repositories, use cases, endpoints, and tests in this project.

---

## 1. Entities & Aggregate Roots
* **Abstractions**: All entities must inherit from the base `Entity` class. Aggregate roots must additionally implement the `IAggregateRoot` marker interface.
* **Encapsulation**: State changes must be performed through clear domain methods (e.g. `Deactivate`, `UpdateName`), rather than setter properties. State updates should call the `SeUpdate()` audit method from the base entity.
* **Folder Structure**: Entity folders must be named in the plural (e.g., `Families`, `Members`, `Accounts`). Respective namespaces must match this pluralization.

## 2. Value Objects (VOs)
* **Representation**: All properties of an entity must be represented by Value Objects rather than raw primitive types (like raw `string`, `int`, `Guid`, etc.), except for structural keys/IDs managed by the base class.
* **Implementation**: Value Objects must be defined as C# `record` types (inheriting from the shared `ValueObject` record base) to leverage native value-based equality, immutability, and clean syntax out-of-the-box.
* **Immutability**: Properties in VOs should be read-only (using `{ get; init; }` or positional records).

## 3. Constructors & Initialization
* **Constructor Signatures**: Do **NOT** pass pre-instantiated Value Objects to entity constructors or behavior methods.
* **Internal Instantiation**: Entity constructors and behavior methods must accept standard C# primitive types (e.g., `string`, `int`, etc.) and instantiate the respective Value Objects internally using static factory methods (e.g., `ValueObject.Create(...)`).
* **Encapsulation**: This ensures the entity manages its VOs and encapsulating validation logic remains within the factory method of the VO.

## 4. Custom Domain Exceptions
* **Base Exception**: All custom exceptions thrown by domain entities or value objects must inherit from the abstract `DomainException` base class.
* **Granular Exceptions**: Avoid throwing generic system exceptions like `ArgumentException`, `ArgumentNullException`, or `InvalidOperationException` in domain classes. Create specific, descriptive exception classes for each validation or state failure rule (e.g., `FamilyNameRequiredException`, `AccountAlreadyLinkedException`).
* **Exception Locations**: Group custom domain exceptions in an `Exceptions` folder within the relevant entity's or bounded context's directory.

## 5. Repositories
* **Interfaces**: Defined in `Domain/Repositories/` inheriting from `IRepository<TAggregate>`. They should manage entity retrieval, adding, updating, and deleting.
* **Implementations**: Placed in `Infrastructure/Repositories/` utilizing the `AppDbContext`.
* **Registration**: Registered in `Infrastructure/DependencyInjection.cs` with Scoped lifetime.

## 6. Use Cases (Application Layer)
* **CQRS Pattern**: Use the source-generated `Mediator` package. Define a Command (`ICommand<Result>` or `ICommand<Result<TResponse>>`) or Query (`IQuery<Result<TResponse>>`) and their corresponding handlers.
* **Validation**: FluentValidation is used. Create validator classes inheriting from `AbstractValidator<TCommandOrQuery>` within the same usecase folder. They are automatically registered.
* **Authorization**: Implement the `IAuthorizeableRequest` interface on commands and queries to declare required permissions checked by `AuthorizationBehavior`.
* **Access Control**: Always fetch the logged-in member's ID from `ICurrentUser` and verify that the target resource belongs to the same `FamilyId` before proceeding.

## 7. Web API Endpoints
* **Minimal APIs**: Group endpoints in classes implementing `IEndpointGroup` inside `Api/Endpoints/`.
* **Convention Routing**: The route prefix is automatically defined as `/api/{classNameLowerWithoutEndpoints}`.
* **Decoupling Contracts**: Use separate `Request` records for JSON request bodies to avoid binding Mediator commands directly, keeping HTTP contracts decoupled from internal command structures.
* **Result Mapping**: Return `result.ToResult()` which maps successes and failures (validation, not found, access denied) to standard HTTP status codes.

## 8. Unit Testing
* **Location**: Place unit tests under `Application.Tests` and `Domain.Tests`.
* **Libraries**: Use `xUnit` for testing framework, `Moq` for mocking interfaces/repositories/ICurrentUser, and `FluentAssertions` for clear assertions.
* **Focus**: Test success paths, validation failures, not found results, and family boundaries access denial rules.
