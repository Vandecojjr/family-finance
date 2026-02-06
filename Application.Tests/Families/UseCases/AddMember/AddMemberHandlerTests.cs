using Application.Families.UseCases.AddMember;
using Domain.Entities.Families;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Families.UseCases.AddMember;

public class AddMemberHandlerTests
{
    private readonly Mock<IFamilyRepository> _familyRepo = new();

    [Fact]
    public async Task Handle_Should_Add_Member_And_Return_Id_When_Family_Exists()
    {
        var family = new Family("Test Family");
        _familyRepo.Setup(r => r.GetByIdWithMembersAsync(family.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(family);

        var handler = new AddMemberHandler(_familyRepo.Object);
        var cmd = new AddMemberCommand(family.Id, "Bob", "bob@mail.com", "DOC-9");

        var result = await handler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBe(Guid.Empty);
        _familyRepo.Verify(r => r.UpdateAsync(family, It.IsAny<CancellationToken>()), Times.Once());
    }

    [Fact]
    public async Task Handle_Should_Return_Failure_When_Family_Not_Found()
    {
        var id = Guid.NewGuid();
        _familyRepo.Setup(r => r.GetByIdWithMembersAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.Families.Family?)null);

        var handler = new AddMemberHandler(_familyRepo.Object);
        var cmd = new AddMemberCommand(id, "Eve", "eve@mail.com", "DOC-10");

        var result = await handler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Code == "FAMILY_NOT_FOUND");
    }
}
