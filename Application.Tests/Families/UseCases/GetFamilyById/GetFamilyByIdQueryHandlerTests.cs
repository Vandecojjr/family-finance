using Application.Shared.Auth;
using Application.Shared.Results;
using Application.UseCases.Families.GetFamilyById;
using Domain.Entities.Families;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Families.UseCases.GetFamilyById;

public class GetFamilyByIdQueryHandlerTests
{
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly GetFamilyByIdQueryHandler _handler;

    public GetFamilyByIdQueryHandlerTests()
    {
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new GetFamilyByIdQueryHandler(_familyRepositoryMock.Object, _currentUserMock.Object);
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
        var query = new GetFamilyByIdQuery(familyId);

        _currentUserMock.Setup(u => u.MemberId).Returns(memberId);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(member);

        _familyRepositoryMock
            .Setup(repo => repo.GetByIdAsync(familyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(family);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Id.Should().Be(familyId);
        result.Value.Name.Should().Be("Silva");
        result.Value.IsActive.Should().BeTrue();
        result.Value.Members.Should().HaveCount(1);
        result.Value.Members.First().Name.Should().Be("John Doe");
        
        _familyRepositoryMock.Verify(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()), Times.Once);
        _familyRepositoryMock.Verify(repo => repo.GetByIdAsync(familyId, It.IsAny<CancellationToken>()), Times.Once);
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
        var query = new GetFamilyByIdQuery(otherFamilyId);

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
        _familyRepositoryMock.Verify(repo => repo.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
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
        var query = new GetFamilyByIdQuery(familyId);

        _currentUserMock.Setup(u => u.MemberId).Returns(memberId);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(member);

        _familyRepositoryMock
            .Setup(repo => repo.GetByIdAsync(familyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Family?)null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Family.NotFound");
        result.Errors[0].Type.Should().Be(ErrorType.NotFound);
        
        _familyRepositoryMock.Verify(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()), Times.Once);
        _familyRepositoryMock.Verify(repo => repo.GetByIdAsync(familyId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
