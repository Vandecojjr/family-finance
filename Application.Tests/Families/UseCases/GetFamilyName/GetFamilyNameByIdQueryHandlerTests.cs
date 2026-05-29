using Application.Shared.Auth;
using Application.Shared.Results;
using Application.UseCases.Families.GetFamilyName;
using Domain.Entities.Families;
using Domain.Entities.Families.ValueObjects;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Families.UseCases.GetFamilyName;

public class GetFamilyNameByIdQueryHandlerTests
{
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly GetFamilyNameByIdQueryHandler _handler;

    public GetFamilyNameByIdQueryHandlerTests()
    {
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new GetFamilyNameByIdQueryHandler(_familyRepositoryMock.Object, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenFamilyExistsAndBelongsToLoggedMember()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var member = family.Members.First();
        var familyId = family.Id;
        var memberId = member.Id;
        var query = new GetFamilyNameByIdQuery(familyId);

        _currentUserMock.Setup(u => u.MemberId).Returns(memberId);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(member);

        _familyRepositoryMock
            .Setup(repo => repo.GetNameByIdAsync(familyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(family.Name);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Name.Should().Be("Silva");
        
        _familyRepositoryMock.Verify(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()), Times.Once);
        _familyRepositoryMock.Verify(repo => repo.GetNameByIdAsync(familyId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenLoggedMemberDoesNotBelongToFamily()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var member = family.Members.First();
        var familyId = family.Id;
        var memberId = member.Id;
        
        var otherFamilyId = Guid.NewGuid();
        var query = new GetFamilyNameByIdQuery(otherFamilyId);

        _currentUserMock.Setup(u => u.MemberId).Returns(memberId);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(member);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Family.AccessDenied");
        result.Errors[0].Type.Should().Be(ErrorType.Failure);
        
        _familyRepositoryMock.Verify(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()), Times.Once);
        _familyRepositoryMock.Verify(repo => repo.GetNameByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenFamilyDoesNotExistButBelongsToLoggedMember()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var member = family.Members.First();
        var familyId = family.Id;
        var memberId = member.Id;
        var query = new GetFamilyNameByIdQuery(familyId);

        _currentUserMock.Setup(u => u.MemberId).Returns(memberId);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(member);

        _familyRepositoryMock
            .Setup(repo => repo.GetNameByIdAsync(familyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((FamilyName?)null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Family.NotFound");
        result.Errors[0].Type.Should().Be(ErrorType.NotFound);
        
        _familyRepositoryMock.Verify(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()), Times.Once);
        _familyRepositoryMock.Verify(repo => repo.GetNameByIdAsync(familyId, It.IsAny<CancellationToken>()), Times.Once);
    }
}


