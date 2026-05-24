using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Families.UseCases.GetFamilyById;
using Application.Shared.Results;
using Domain.Entities.Families;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Families.UseCases.GetFamilyById;

public class GetFamilyByIdQueryHandlerTests
{
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly GetFamilyByIdQueryHandler _handler;

    public GetFamilyByIdQueryHandlerTests()
    {
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _handler = new GetFamilyByIdQueryHandler(_familyRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenFamilyExists()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var familyId = family.Id;
        var query = new GetFamilyByIdQuery(familyId);

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
        _familyRepositoryMock.Verify(repo => repo.GetByIdAsync(familyId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenFamilyDoesNotExist()
    {
        // Arrange
        var familyId = Guid.NewGuid();
        var query = new GetFamilyByIdQuery(familyId);

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
        _familyRepositoryMock.Verify(repo => repo.GetByIdAsync(familyId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
