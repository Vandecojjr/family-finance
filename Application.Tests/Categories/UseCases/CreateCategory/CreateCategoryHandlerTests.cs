using Application.Categories.UseCases.CreateCategory;
using Domain.Entities.Categories;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Categories.UseCases.CreateCategory;

public class CreateCategoryHandlerTests
{
    private readonly Mock<ICategoryRepository> _categoryRepositoryMock;
    private readonly CreateCategoryHandler _handler;

    public CreateCategoryHandlerTests()
    {
        _categoryRepositoryMock = new Mock<ICategoryRepository>();
        _handler = new CreateCategoryHandler(_categoryRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldCreateCategory_WhenValid()
    {
        var familyId = Guid.NewGuid();
        var command = new CreateCategoryCommand("New Category", CategoryType.Expense, familyId);

        _categoryRepositoryMock.Setup(x =>
                x.ExistParentCategoryByNameAsync(command.Name, command.FamilyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        _categoryRepositoryMock.Verify(
            x => x.AddAsync(It.Is<Category>(c => c.Name == command.Name && c.FamilyId == familyId),
                It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldCreateSubCategory_WhenParentIsValid()
    {
        var familyId = Guid.NewGuid();
        var parentId = Guid.NewGuid();
        var parent = new Category("Parent", CategoryType.Expense, familyId);
        var command = new CreateCategoryCommand("SubCategory", CategoryType.Expense, familyId, parentId);

        _categoryRepositoryMock.Setup(x => x.GetByIdAsyncWithSubCategories(parentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(parent);
        _categoryRepositoryMock.Setup(x =>
                x.ExistParentCategoryByNameAsync(command.Name, command.FamilyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        _categoryRepositoryMock.Verify(
            x => x.AddAsync(It.Is<Category>(c => c.Name == command.Name && c.ParentId == parentId),
                It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenParentNotFound()
    {
        var familyId = Guid.NewGuid();
        var parentId = Guid.NewGuid();
        var command = new CreateCategoryCommand("SubCategory", CategoryType.Expense, familyId, parentId);

        _categoryRepositoryMock.Setup(x => x.GetByIdAsyncWithSubCategories(parentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Category?)null);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Code == "CATEGORY_PARENT_NOT_FOUND");
    }
}
