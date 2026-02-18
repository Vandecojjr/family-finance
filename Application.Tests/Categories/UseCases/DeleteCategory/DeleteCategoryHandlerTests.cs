using Application.Categories.UseCases.DeleteCategory;
using Application.Shared.Auth;
using Domain.Entities.Categories;
using Domain.Entities.Families;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Categories.UseCases.DeleteCategory;

public class DeleteCategoryHandlerTests
{
    private readonly Mock<ICategoryRepository> _categoryRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly DeleteCategoryHandler _handler;

    public DeleteCategoryHandlerTests()
    {
        _categoryRepositoryMock = new Mock<ICategoryRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new DeleteCategoryHandler(
            _categoryRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldDeleteCategory_WhenValid()
    {
        // Arrange
        var accountId = Guid.NewGuid();
        var family = new Family("Test Family");
        var categoryId = Guid.NewGuid();
        var category = new Category("Delete Me", CategoryType.Expense, family.Id);

        var command = new DeleteCategoryCommand(categoryId);

        _currentUserMock.Setup(x => x.AccountId).Returns(accountId);
        _familyRepositoryMock.Setup(x => x.GetByMemberIdAsync(accountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(family);
        _categoryRepositoryMock.Setup(x => x.GetByIdAsyncWithSubCategories(categoryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _categoryRepositoryMock.Verify(x => x.RemoveAsync(category, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenHasSubcategories()
    {
        // Arrange
        var accountId = Guid.NewGuid();
        var family = new Family("Test Family");
        var categoryId = Guid.NewGuid();
        var category = new Category("Parent", CategoryType.Expense, family.Id);

        // Adding a subcategory
        category.SubCategories.Add(new Category("Child", CategoryType.Expense, family.Id));

        var command = new DeleteCategoryCommand(categoryId);

        _currentUserMock.Setup(x => x.AccountId).Returns(accountId);
        _familyRepositoryMock.Setup(x => x.GetByMemberIdAsync(accountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(family);
        _categoryRepositoryMock.Setup(x => x.GetByIdAsyncWithSubCategories(categoryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Code == "CATEGORY_HAS_SUBCATEGORIES");
    }
}
