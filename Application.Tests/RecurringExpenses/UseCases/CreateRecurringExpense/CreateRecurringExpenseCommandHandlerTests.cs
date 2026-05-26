using Application.RecurringExpenses.UseCases.CreateRecurringExpense;
using Application.Shared.Auth;
using Domain.Entities.Families;
using Domain.Entities.Categories;
using Domain.Entities.RecurringExpenses;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.RecurringExpenses.UseCases.CreateRecurringExpense;

public class CreateRecurringExpenseCommandHandlerTests
{
    private readonly Mock<IRecurringExpenseRepository> _recurringExpenseRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICategoryRepository> _categoryRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly CreateRecurringExpenseCommandHandler _handler;

    public CreateRecurringExpenseCommandHandlerTests()
    {
        _recurringExpenseRepositoryMock = new Mock<IRecurringExpenseRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _categoryRepositoryMock = new Mock<ICategoryRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new CreateRecurringExpenseCommandHandler(
            _recurringExpenseRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _categoryRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenTargetMemberAndCategoryAreValid()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var category = new Category("Energia", CategoryType.Expense, family.Id);
        var targetMember = currentMember;
        var command = new CreateRecurringExpenseCommand(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            targetMember.Id,
            category.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByIdAsync(category.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();

        _recurringExpenseRepositoryMock.Verify(
            repo => repo.AddAsync(It.IsAny<RecurringExpense>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCurrentUserMemberNotFound()
    {
        // Arrange
        var command = new CreateRecurringExpenseCommand(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            Guid.NewGuid(),
            Guid.NewGuid());

        var currentMemberId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.MemberId).Returns(currentMemberId);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMemberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.Members.Member?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("User.MemberNotFound");

        _recurringExpenseRepositoryMock.Verify(
            repo => repo.AddAsync(It.IsAny<RecurringExpense>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenTargetMemberNotFound()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var command = new CreateRecurringExpenseCommand(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            Guid.NewGuid(),
            Guid.NewGuid());

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(command.MemberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.Members.Member?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Member.NotFound");

        _recurringExpenseRepositoryMock.Verify(
            repo => repo.AddAsync(It.IsAny<RecurringExpense>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenTargetMemberBelongsToDifferentFamily()
    {
        // Arrange
        var family1 = new Family("Silva");
        family1.AddMember("John Doe");
        var currentMember = family1.Members.First();

        var family2 = new Family("Other");
        family2.AddMember("Jane Doe");
        var targetMember = family2.Members.First();

        var command = new CreateRecurringExpenseCommand(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            targetMember.Id,
            Guid.NewGuid());

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(targetMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(targetMember);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Family.AccessDenied");

        _recurringExpenseRepositoryMock.Verify(
            repo => repo.AddAsync(It.IsAny<RecurringExpense>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCategoryNotFound()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var command = new CreateRecurringExpenseCommand(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            currentMember.Id,
            Guid.NewGuid());

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByIdAsync(command.CategoryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Category?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Category.NotFound");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCategoryBelongsToDifferentFamily()
    {
        // Arrange
        var family1 = new Family("Silva");
        family1.AddMember("John Doe");
        var currentMember = family1.Members.First();

        var family2 = new Family("Other");
        var otherCategory = new Category("Energia", CategoryType.Expense, family2.Id);

        var command = new CreateRecurringExpenseCommand(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            currentMember.Id,
            otherCategory.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByIdAsync(otherCategory.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(otherCategory);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Family.AccessDenied");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCategoryIsIncomeType()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var incomeCategory = new Category("Salário", CategoryType.Income, family.Id);

        var command = new CreateRecurringExpenseCommand(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            currentMember.Id,
            incomeCategory.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByIdAsync(incomeCategory.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(incomeCategory);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Category.InvalidType");
    }
}
