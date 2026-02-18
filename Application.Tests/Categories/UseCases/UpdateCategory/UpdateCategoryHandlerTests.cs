using Application.Categories.UseCases.UpdateCategory;
using Application.Shared.Auth;
using Domain.Entities.Categories;
using Domain.Entities.Families;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Categories.UseCases.UpdateCategory;

public class UpdateCategoryHandlerTests
{
    private readonly Mock<ICategoryRepository> _categoryRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly UpdateCategoryHandler _handler;

    public UpdateCategoryHandlerTests()
    {
        _categoryRepositoryMock = new Mock<ICategoryRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new UpdateCategoryHandler(
            _categoryRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldUpdateCategory_WhenValid()
    {
        // Arrange
        var accountId = Guid.NewGuid();
        var family = new Family("Test Family");
        var categoryId = Guid.NewGuid();
        var category = new Category("Old Name", CategoryType.Expense, family.Id);

        // Use reflection or a trick to set Id because it's usually set by EF or protected
        // For simplicity in tests, we can assume the mock returns this object when GetById is called

        var command = new UpdateCategoryCommand(categoryId, "New Name", CategoryType.Expense);

        _currentUserMock.Setup(x => x.AccountId).Returns(accountId);
        _familyRepositoryMock.Setup(x => x.GetByMemberIdAsync(accountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(family);
        _categoryRepositoryMock.Setup(x => x.GetByIdAsyncWithSubCategories(categoryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        category.Name.Should().Be("New Name");
        _categoryRepositoryMock.Verify(x => x.UpdateAsync(category, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenUpdatingSystemCategory()
    {
        // Arrange
        var accountId = Guid.NewGuid();
        var family = new Family("Test Family");
        var categoryId = Guid.NewGuid();
        var category = new Category("System Category", CategoryType.Expense, Guid.NewGuid()); // Different family ID

        var command = new UpdateCategoryCommand(categoryId, "New Name", CategoryType.Expense);

        _currentUserMock.Setup(x => x.AccountId).Returns(accountId);
        _familyRepositoryMock.Setup(x => x.GetByMemberIdAsync(accountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(family);
        _categoryRepositoryMock.Setup(x => x.GetByIdAsyncWithSubCategories(categoryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Code == "CATEGORY_FORBIDDEN");
    }
}
