using Application.Categories.UseCases.GetCategories;
using Application.Shared.Auth;
using Domain.Entities.Categories;
using Domain.Entities.Families;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Categories.UseCases.GetCategories;

public class GetCategoriesHandlerTests
{
    private readonly Mock<ICategoryRepository> _categoryRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly GetCategoriesHandler _handler;

    public GetCategoriesHandlerTests()
    {
        _categoryRepositoryMock = new Mock<ICategoryRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new GetCategoriesHandler(
            _categoryRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnCategories_WhenFamilyExists()
    {
        var accountId = Guid.NewGuid();
        var family = new Family("Test Family");
        var categories = new List<Category>
        {
            new Category("Alimentação", CategoryType.Expense, family.Id),
            new Category("Salário", CategoryType.Income, family.Id)
        };

        _currentUserMock.Setup(x => x.AccountId).Returns(accountId);
        _familyRepositoryMock.Setup(x => x.GetByMemberIdAsync(accountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(family);
        _categoryRepositoryMock.Setup(x => x.GetAllForFamilyAsync(family.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(categories);

        var result = await _handler.Handle(new GetCategoriesQuery(), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Should().HaveCount(2);
        result.Value.Should().Contain(x => x.Name == "Alimentação");
        result.Value.Should().Contain(x => x.Name == "Salário");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenFamilyNotFound()
    {
        var accountId = Guid.NewGuid();
        _currentUserMock.Setup(x => x.AccountId).Returns(accountId);
        _familyRepositoryMock.Setup(x => x.GetByMemberIdAsync(accountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Family?)null);

        var result = await _handler.Handle(new GetCategoriesQuery(), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }
}
