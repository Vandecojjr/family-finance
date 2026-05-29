using Application.Shared.Auth;
using Application.Shared.Authorization;
using Application.UseCases.Categories.ListCategories;
using Domain.Entities.Categories;
using Domain.Entities.Families;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Categories.UseCases.ListCategories;

public class ListCategoriesQueryHandlerTests
{
    private readonly Mock<ICategoryRepository> _categoryRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly ListCategoriesQueryHandler _handler;

    public ListCategoriesQueryHandlerTests()
    {
        _categoryRepositoryMock = new Mock<ICategoryRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new ListCategoriesQueryHandler(
            _categoryRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public void Query_ShouldImplementIAuthorizeableRequest_WithCategoryViewPermission()
    {
        // Arrange & Act
        var query = new ListCategoriesQuery();

        // Assert
        query.Should().BeAssignableTo<IAuthorizeableRequest>();
        query.RequiredPermissions.Should().ContainSingle(p => p == Permission.CategoryView);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WithNestedCategoriesHierarchy()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("Member");
        var currentMember = family.Members.First();

        var parent1 = new Category("Alimentação", CategoryType.Expense, family.Id);
        var sub1 = new Category("Mercado", CategoryType.Expense, family.Id, parent1.Id);
        var sub2 = new Category("Restaurante", CategoryType.Expense, family.Id, parent1.Id);

        var parent2 = new Category("Lazer", CategoryType.Expense, family.Id);
        var sub3 = new Category("Cinema", CategoryType.Expense, family.Id, parent2.Id);

        var parent3 = new Category("Salário", CategoryType.Income, family.Id);

        var allCategories = new List<Category> { parent1, sub1, sub2, parent2, sub3, parent3 };

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByFamilyIdAsync(family.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(allCategories.AsReadOnly());

        var query = new ListCategoriesQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(3); // parent1, parent2, parent3 (top level)

        var mappedParent1 = result.Value.Should().ContainSingle(c => c.Id == parent1.Id).Subject;
        mappedParent1.SubCategories.Should().HaveCount(2);
        mappedParent1.SubCategories.Should().Contain(c => c.Id == sub1.Id);
        mappedParent1.SubCategories.Should().Contain(c => c.Id == sub2.Id);

        var mappedParent2 = result.Value.Should().ContainSingle(c => c.Id == parent2.Id).Subject;
        mappedParent2.SubCategories.Should().HaveCount(1);
        mappedParent2.SubCategories.Should().Contain(c => c.Id == sub3.Id);

        var mappedParent3 = result.Value.Should().ContainSingle(c => c.Id == parent3.Id).Subject;
        mappedParent3.SubCategories.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyCollection_WhenNoCategoriesExist()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("Member");
        var currentMember = family.Members.First();

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByFamilyIdAsync(family.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Category>().AsReadOnly());

        var query = new ListCategoriesQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCurrentUserMemberNotFound()
    {
        // Arrange
        var query = new ListCategoriesQuery();
        var currentMemberId = Guid.NewGuid();

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMemberId);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMemberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.Members.Member?)null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("User.MemberNotFound");
    }
}


