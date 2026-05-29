using Application.Shared.Auth;
using Application.UseCases.RecurringExpenses.GetTotalFixedExpensesByMember;
using Domain.Entities.Families;
using Domain.Entities.Expenses;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.RecurringExpenses.UseCases.GetTotalFixedExpensesByMember;

public class GetTotalFixedExpensesByMemberQueryHandlerTests
{
    private readonly Mock<IExpenseRepository> _expenseRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly GetTotalFixedExpensesByMemberQueryHandler _handler;

    public GetTotalFixedExpensesByMemberQueryHandlerTests()
    {
        _expenseRepositoryMock = new Mock<IExpenseRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new GetTotalFixedExpensesByMemberQueryHandler(
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

        var expense = Expense.CreateRecurring(
            "Internet",
            150.75m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow,
            null,
            currentMember.Id,
            Guid.NewGuid());
        var expensesList = new List<Expense> { expense };

        var targetMember = currentMember;
        var query = new GetTotalFixedExpensesByMemberQuery(targetMember.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(targetMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(targetMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetAllByMemberAsync(targetMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expensesList.AsReadOnly());

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(150.75m);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCurrentUserMemberNotFound()
    {
        // Arrange
        var query = new GetTotalFixedExpensesByMemberQuery(Guid.NewGuid());

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
    public async Task Handle_ShouldReturnFailureResult_WhenTargetMemberNotFound()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var query = new GetTotalFixedExpensesByMemberQuery(Guid.NewGuid());

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(query.MemberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.Members.Member?)null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Member.NotFound");
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

        var query = new GetTotalFixedExpensesByMemberQuery(targetMember.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(targetMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(targetMember);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Family.AccessDenied");
    }
}


