using Application.Families.UseCases.GetFamilyById;
using Domain.Entities.Families;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Families.UseCases.GetFamilyById;

public class GetFamilyByIdHandlerTests
{
    private readonly Mock<IFamilyRepository> _familyRepo = new();

    [Fact]
    public async Task Handle_Should_Return_FamilyDto_When_Found()
    {
        var family = new Family("Smith family");
        var member = new Member("Alice", "alice@mail.com", "DOC-1", family.Id);
        family.AddMember(member);
        _familyRepo.Setup(r => r.GetByIdAsync(family.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(family);

        var handler = new GetFamilyByIdHandler(_familyRepo.Object);
        var query = new GetFamilyByIdQuery(family.Id);

        var result = await handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Id.Should().Be(family.Id);
        result.Value!.Name.Should().Be("Smith family");
        result.Value!.NumberMember.Should().Be(1);
    }

    [Fact]
    public async Task Handle_Should_Return_Failure_When_Not_Found()
    {
        var id = Guid.NewGuid();
        _familyRepo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Family?)null);

        var handler = new GetFamilyByIdHandler(_familyRepo.Object);
        var query = new GetFamilyByIdQuery(id);

        var result = await handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Code == "FAMILY_NOT_FOUND");
    }
}
