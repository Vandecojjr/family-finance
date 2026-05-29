using Application.Shared.Auth;
using Application.UseCases.Families.GetMyFamily;
using Domain.Entities.Families;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Families.UseCases.GetMyFamily;

public class GetMyFamilyQueryHandlerTests
{
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly GetMyFamilyQueryHandler _handler;

    public GetMyFamilyQueryHandlerTests()
    {
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new GetMyFamilyQueryHandler(_familyRepositoryMock.Object, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenLoggedMemberAndFamilyExist()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var member = family.Members.First();
        var familyId = family.Id;
        var memberId = member.Id;
        var query = new GetMyFamilyQuery();

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
        
        _familyRepositoryMock.Verify(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()), Times.Once);
        _familyRepositoryMock.Verify(repo => repo.GetByIdAsync(familyId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenLoggedMemberDoesNotExist()
    {
        // Arrange
        var memberId = Guid.NewGuid();
        var query = new GetMyFamilyQuery();

        _currentUserMock.Setup(u => u.MemberId).Returns(memberId);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.Members.Member?)null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Member.NotFound");
        
        _familyRepositoryMock.Verify(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()), Times.Once);
        _familyRepositoryMock.Verify(repo => repo.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenFamilyDoesNotExist()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var member = family.Members.First();
        var familyId = family.Id;
        var memberId = member.Id;
        var query = new GetMyFamilyQuery();

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
        
        _familyRepositoryMock.Verify(repo => repo.GetMemberByIdAsync(memberId, It.IsAny<CancellationToken>()), Times.Once);
        _familyRepositoryMock.Verify(repo => repo.GetByIdAsync(familyId, It.IsAny<CancellationToken>()), Times.Once);
    }
}


