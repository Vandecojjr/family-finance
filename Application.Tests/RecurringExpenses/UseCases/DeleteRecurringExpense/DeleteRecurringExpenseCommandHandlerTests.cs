using Application.Shared.Auth;
using Application.UseCases.RecurringExpenses.DeleteRecurringExpense;
using Domain.Entities.Families;
using Domain.Entities.Expenses;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.RecurringExpenses.UseCases.DeleteRecurringExpense;

public class DeleteRecurringExpenseCommandHandlerTests
{
    private readonly Mock<IExpenseRepository> _expenseRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly DeleteRecurringExpenseCommandHandler _handler;

    public DeleteRecurringExpenseCommandHandlerTests()
    {
        _expenseRepositoryMock = new Mock<IExpenseRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new DeleteRecurringExpenseCommandHandler(
            _expenseRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenExpenseBelongsToUserFamily()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var targetMember = currentMember;
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

        var command = new DeleteRecurringExpenseCommand(expense.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(expense.MemberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(targetMember);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _expenseRepositoryMock.Verify(repo => repo.DeleteAsync(expense, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenExpenseNotFound()
    {
        // Arrange
        var command = new DeleteRecurringExpenseCommand(Guid.NewGuid());
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(command.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Expense?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Expense.NotFound");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCurrentUserMemberNotFound()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var targetMember = family.Members.First();
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

        var command = new DeleteRecurringExpenseCommand(expense.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(Guid.NewGuid());
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.Members.Member?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("User.MemberNotFound");
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

        var command = new DeleteRecurringExpenseCommand(expense.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(expense.MemberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(targetMember);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Family.AccessDenied");
    }
}


