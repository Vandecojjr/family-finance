using Application.Shared.Auth;
using Application.UseCases.RecurringExpenses.GetRecurringExpensesByMember;
using Domain.Entities.Families;
using Domain.Entities.Expenses;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.RecurringExpenses.UseCases.GetRecurringExpensesByMember;

public class GetRecurringExpensesByMemberQueryHandlerTests
{
    private readonly Mock<IExpenseRepository> _expenseRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly GetRecurringExpensesByMemberQueryHandler _handler;

    public GetRecurringExpensesByMemberQueryHandlerTests()
    {
        _expenseRepositoryMock = new Mock<IExpenseRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new GetRecurringExpensesByMemberQueryHandler(
            _expenseRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenTargetMemberBelongsToUserFamily()
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

        var expensesList = new List<Expense> { expense };
        var query = new GetRecurringExpensesByMemberQuery(targetMember.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.ExistsMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _expenseRepositoryMock
            .Setup(repo => repo.GetAllRecurringByMemberAsync(targetMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expensesList.AsReadOnly());

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Should().ContainSingle();
        result.Value!.First().Description.Should().Be("Internet");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCurrentUserMemberNotFound()
    {
        // Arrange
        var query = new GetRecurringExpensesByMemberQuery(Guid.NewGuid());

        var currentMemberId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.MemberId).Returns(currentMemberId);
        _familyRepositoryMock
            .Setup(repo => repo.ExistsMemberByIdAsync(currentMemberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("User.MemberNotFound");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenTargetMemberIsDifferentFromCurrentUser()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var query = new GetRecurringExpensesByMemberQuery(Guid.NewGuid());

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.ExistsMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Family.AccessDenied");
    }
}
