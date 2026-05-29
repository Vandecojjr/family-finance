using Application.Shared.Auth;
using Application.UseCases.RecurringExpenses.UpdateRecurringExpense;
using Domain.Entities.Families;
using Domain.Entities.Categories;
using Domain.Entities.Expenses;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.RecurringExpenses.UseCases.UpdateRecurringExpense;

public class UpdateRecurringExpenseCommandHandlerTests
{
    private readonly Mock<IExpenseRepository> _expenseRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICategoryRepository> _categoryRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly UpdateRecurringExpenseCommandHandler _handler;

    public UpdateRecurringExpenseCommandHandlerTests()
    {
        _expenseRepositoryMock = new Mock<IExpenseRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _categoryRepositoryMock = new Mock<ICategoryRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new UpdateRecurringExpenseCommandHandler(
            _expenseRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _categoryRepositoryMock.Object,
            _currentUserMock.Object);
    }

    private static void SetMember(Expense expense, Domain.Entities.Members.Member member)
    {
        var property = typeof(Expense).GetProperty(nameof(Expense.Member));
        property?.SetValue(expense, member);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenExpenseAndCategoryAreValid()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var category = new Category("Energia", CategoryType.Expense, family.Id);
        var expense = Expense.CreateRecurring(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            currentMember.Id,
            category.Id);
        SetMember(expense, currentMember);

        var newCategory = new Category("Água", CategoryType.Expense, family.Id);

        var command = new UpdateRecurringExpenseCommand(
            expense.Id,
            "Internet Fibra",
            120.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            15,
            DateTime.UtcNow,
            null,
            newCategory.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByIdAsync(newCategory.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(newCategory);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        expense.Description.Value.Should().Be("Internet Fibra");
        expense.Amount.Value.Should().Be(120.00m);
        expense.DueDay!.Value.Should().Be(15);
        expense.CategoryId.Should().Be(newCategory.Id);

        _expenseRepositoryMock.Verify(
            repo => repo.UpdateAsync(expense, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCurrentUserMemberNotFound()
    {
        // Arrange
        var command = new UpdateRecurringExpenseCommand(
            Guid.NewGuid(),
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
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

        _expenseRepositoryMock.Verify(
            repo => repo.UpdateAsync(It.IsAny<Expense>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenExpenseNotFound()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var expenseId = Guid.NewGuid();
        var command = new UpdateRecurringExpenseCommand(
            expenseId,
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            Guid.NewGuid());

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expenseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Expense?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Expense.NotFound");

        _expenseRepositoryMock.Verify(
            repo => repo.UpdateAsync(It.IsAny<Expense>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenExpenseBelongsToDifferentFamily()
    {
        // Arrange
        var family1 = new Family("Silva");
        family1.AddMember("John Doe");
        var currentMember = family1.Members.First();

        var family2 = new Family("Other");
        family2.AddMember("Jane Doe");
        var targetMember = family2.Members.First();

        var expense = Expense.CreateRecurring(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            targetMember.Id,
            Guid.NewGuid());
        SetMember(expense, targetMember);

        var command = new UpdateRecurringExpenseCommand(
            expense.Id,
            "Internet Fibra",
            120.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            15,
            DateTime.UtcNow,
            null,
            Guid.NewGuid());

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Family.AccessDenied");

        _expenseRepositoryMock.Verify(
            repo => repo.UpdateAsync(It.IsAny<Expense>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCategoryNotFound()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var category = new Category("Energia", CategoryType.Expense, family.Id);
        var expense = Expense.CreateRecurring(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            currentMember.Id,
            category.Id);
        SetMember(expense, currentMember);

        var command = new UpdateRecurringExpenseCommand(
            expense.Id,
            "Internet Fibra",
            120.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            15,
            DateTime.UtcNow,
            null,
            Guid.NewGuid()); // Random category id that won't be found

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);
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

        var category = new Category("Energia", CategoryType.Expense, family1.Id);
        var expense = Expense.CreateRecurring(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            currentMember.Id,
            category.Id);
        SetMember(expense, currentMember);

        var family2 = new Family("Other");
        var otherCategory = new Category("Energia", CategoryType.Expense, family2.Id);

        var command = new UpdateRecurringExpenseCommand(
            expense.Id,
            "Internet Fibra",
            120.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            15,
            DateTime.UtcNow,
            null,
            otherCategory.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);
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

        var category = new Category("Energia", CategoryType.Expense, family.Id);
        var expense = Expense.CreateRecurring(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            currentMember.Id,
            category.Id);
        SetMember(expense, currentMember);

        var incomeCategory = new Category("Salário", CategoryType.Income, family.Id);

        var command = new UpdateRecurringExpenseCommand(
            expense.Id,
            "Internet Fibra",
            120.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            15,
            DateTime.UtcNow,
            null,
            incomeCategory.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);
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


