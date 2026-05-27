# DDD & Architecture Guidelines

## 1. Entities & Aggregates
- Base: Inherit from `Entity`.
- Aggregate Roots: Implement `IAggregateRoot`.
- Encapsulation: Methods only (e.g., `Deactivate()`, `UpdateName()`). No public setters. Call `SeUpdate()` on state changes.
- Folders/Namespaces: Plural names only (e.g., `Families/`, `Members/`).

## 2. Value Objects (VOs)
- Rule: All entity properties must be VOs, except primitive IDs managed by the base class.
- Type: C# `record` inheriting from `ValueObject`.
- Immutability: Read-only properties via `{ get; init; }` or positional records.

## 3. Initialization
- Constructor Signatures: Accept C# primitive types only. Do NOT pass pre-instantiated VOs.
- Instantiation: Instantiate VOs internally using static factories (e.g., `ValueObject.Create(...)`).

## 4. Exceptions
- Base: Inherit from `DomainException`.
- Rule: No generic exceptions (`ArgumentException`, etc.). Create specific classes (e.g., `FamilyNameRequiredException`).
- Location: `Exceptions/` folder inside the relevant entity directory.

## 5. Repositories
- Interface: `Domain/Repositories/IRepository<TAggregate>`.
- Implementation: `Infrastructure/Repositories/` using `AppDbContext`.
- DI: Registered in `Infrastructure/DependencyInjection.cs` as Scoped.

## 6. Application Layer (Use Cases)
- Pattern: CQRS via source-generated `Mediator`. Commands (`ICommand`) or Queries (`IQuery`).
- Validation: `FluentValidation`. Class inherits from `AbstractValidator<T>` in the same usecase folder.
- Auth: Implement `IAuthorizeableRequest` on commands/queries for `AuthorizationBehavior`.
- Tenant/Security: Fetch member ID from `ICurrentUser`. Validate resource ownership via `FamilyId` before execution.

## 7. Web API Endpoints
- Pattern: Minimal APIs implementing `IEndpointGroup` inside `Api/Endpoints/`.
- Routing: Auto-prefixed as `/api/{classNameLowerWithoutEndpoints}`.
- Contracts: Decouple HTTP contracts. Use separate `Request` records for JSON bodies instead of binding Mediator commands directly.
- Responses: Map via `result.ToResult()`.

## 8. Unit Testing
- Projects: `Application.Tests` and `Domain.Tests`.
- Stack: `xUnit`, `Moq`, and `FluentAssertions`.
- Targets: Success paths, validators, missing data, and `FamilyId` access boundaries.