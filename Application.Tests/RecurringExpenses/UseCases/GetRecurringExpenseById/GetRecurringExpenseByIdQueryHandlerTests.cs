using Application.Shared.Auth;
using Application.UseCases.RecurringExpenses.GetRecurringExpenseById;
using Domain.Entities.Families;
using Domain.Entities.Expenses;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.RecurringExpenses.UseCases.GetRecurringExpenseById;

public class GetRecurringExpenseByIdQueryHandlerTests
{
    private readonly Mock<IExpenseRepository> _expenseRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly GetRecurringExpenseByIdQueryHandler _handler;

    public GetRecurringExpenseByIdQueryHandlerTests()
    {
        _expenseRepositoryMock = new Mock<IExpenseRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new GetRecurringExpenseByIdQueryHandler(
            _expenseRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    private static void SetMember(Expense expense, Domain.Entities.Members.Member member)
    {
        var property = typeof(Expense).GetProperty(nameof(Expense.Member));
        property?.SetValue(expense, member);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenExpenseBelongsToUserFamily()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var expense = Expense.CreateRecurring(
            "Internet",
            100.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            currentMember.Id,
            Guid.NewGuid());
        SetMember(expense, currentMember);

        var query = new GetRecurringExpenseByIdQuery(expense.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Id.Should().Be(expense.Id);
        result.Value.Description.Should().Be("Internet");
        result.Value.Amount.Should().Be(100.00m);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCurrentUserMemberNotFound()
    {
        // Arrange
        var query = new GetRecurringExpenseByIdQuery(Guid.NewGuid());

        var currentMemberId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.MemberId).Returns(currentMemberId);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMemberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.Members.Member?)null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("User.MemberNotFound");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenExpenseNotFound()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var expenseId = Guid.NewGuid();
        var query = new GetRecurringExpenseByIdQuery(expenseId);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expenseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Expense?)null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Expense.NotFound");
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

        var query = new GetRecurringExpenseByIdQuery(expense.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Family.AccessDenied");
    }
}


