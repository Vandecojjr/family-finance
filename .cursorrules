# family-finance — Project Standards

## 1. Tech Stack
- Platform: C# 13, .NET 10.0 (`net10.0`)
- Web: ASP.NET Core Minimal APIs | Docs: Scalar (`Scalar.AspNetCore`)
- DB: EF Core | Validation: FluentValidation (`AbstractValidator<T>`)
- Mediator: Source-generated `Mediator` (`Mediator` namespace, handlers return `ValueTask`, NOT `MediatR`).
- Tests: xUnit, Moq, FluentAssertions.

## 2. Solution Structure
- `Domain/`: Entities (`Entities/`), VOs (`Entities/[Name]/ValueObjects/`), Exceptions (`Entities/[Name]/Exceptions/`), Repository Interfaces (`Repositories/`).
- `Application/`: CQRS (`[Entity]/UseCases/[UseCase]/`), Handlers/Validators (same folder), DTOs, `ICurrentUser`.
- `Infrastructure/`: `AppDbContext`, EF Configs (`Data/Configurations/`), Repo implementations, Security (BCrypt, JWT).
- `Api/`: Minimal APIs mapping via `IEndpointGroup`.
- `Domain.Tests` / `Application.Tests`: Unit tests.

## 3. Coding Guidelines

### 3.1. Entities & Aggregates
- Base: Inherit from `Domain.Shared.Entities.Entity` (exposes `Guid Id`, `DateTime CreatedAt/UpdatedAt`).
- Mutation: Call `SeUpdate()` inside mutating domain methods.
- Aggregate Roots: Implement `IAggregateRoot`.
- Encapsulation: Methods only (e.g., `Deactivate()`). No public setters.
- CTORs: Protected parameterless with `#pragma warning disable CS8618` for EF. Public CTORs accept primitive types only and instantiate VOs internally.
- Naming: Folders/namespaces must be plural (e.g., `Families`, `Members`).

### 3.2. Value Objects (VOs)
- Type: C# `record` inheriting from `ValueObject`.
- Immutability: Read-only properties via `{ get; init; }` or positional records.
- Instantiation: Static factory `public static ValueObject Create(primitive)` handling validation and domain exceptions.

### 3.3. Domain Exceptions
- Base: Inherit from abstract `DomainException`. No generic system exceptions.
- Location: `Exceptions/` folder inside the relevant entity directory.

### 3.4. CQRS (Application)
- Contracts: `CreateSomethingCommand(...) : ICommand<Result>` or `IQuery<Result<Dto>>` from `Mediator` namespace.
- Handlers: Inherit `ICommandHandler<T, R>` or `IQueryHandler<T, R>`. Return `ValueTask<TResult>`.
- Validation: `AbstractValidator<T>` in the same usecase folder.
- Security: Implement `IAuthorizeableRequest`. Check ownership via `ICurrentUser.FamilyId`. Return `Result.Failure` on access denial.
- Mappers: Use extension classes (e.g., `family.ToResponse()`). No direct entity exposure.

### 3.5. EF Core Configurations
- Location: `Infrastructure/Data/Configurations/`.
- Rule 1: Map VOs using `.HasConversion(vo => vo.Value, val => VO.Create(val))`.
- Rule 2: Back collections with fields via `.Metadata.PrincipalToDependent.SetPropertyAccessMode(PropertyAccessMode.Field)`.

### 3.6. Presentation (API)
- Location: `Api/Endpoints/` implementing `IEndpointGroup`.
- Rules: Route auto-prefixed via class name. Decouple JSON requests from Mediator commands. Return `HttpResult` via `result.ToResult()`.

### 3.7. Quality & Warnings
- Strict Policy: Zero compiler warnings allowed. `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` is active.
- Vulnerabilities: Fix NuGet audit warnings immediately by upgrading or forcing secure versions in `.csproj`.

## 4. Post-Task Report — Token Usage
Always append a token and cost estimation table at the very end of your response, after the change summary: