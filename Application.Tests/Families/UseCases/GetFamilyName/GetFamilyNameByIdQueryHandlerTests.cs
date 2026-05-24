using System;
using System.Threading;
using System.Threading.Tasks;
using Application.Families.UseCases.GetFamilyName;
using Application.Shared.Results;
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
    private readonly GetFamilyNameByIdQueryHandler _handler;

    public GetFamilyNameByIdQueryHandlerTests()
    {
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _handler = new GetFamilyNameByIdQueryHandler(_familyRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenFamilyExists()
    {
        // Arrange
        var family = new Family("Silva");
        var familyId = family.Id;
        var query = new GetFamilyNameByIdQuery(familyId);

        _familyRepositoryMock
            .Setup(repo => repo.GetNameByIdAsync(familyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(family.Name);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Name.Should().Be("Silva");
        _familyRepositoryMock.Verify(repo => repo.GetNameByIdAsync(familyId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenFamilyDoesNotExist()
    {
        // Arrange
        var familyId = Guid.NewGuid();
        var query = new GetFamilyNameByIdQuery(familyId);

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
        _familyRepositoryMock.Verify(repo => repo.GetNameByIdAsync(familyId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
