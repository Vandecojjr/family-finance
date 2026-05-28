using Application.Shared.Auth;
using Application.Shared.Authorization;
using Application.UseCases.Categories.CreateCategory;
using Domain.Entities.Categories;
using Domain.Entities.Families;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Categories.UseCases.CreateCategory;

public class CreateCategoryCommandHandlerTests
{
    private readonly Mock<ICategoryRepository> _categoryRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly CreateCategoryCommandHandler _handler;

    public CreateCategoryCommandHandlerTests()
    {
        _categoryRepositoryMock = new Mock<ICategoryRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new CreateCategoryCommandHandler(
            _categoryRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public void Command_ShouldImplementIAuthorizeableRequest_WithCategoryCreatePermission()
    {
        // Arrange & Act
        var command = new CreateCategoryCommand("Alimentação", CategoryType.Expense);

        // Assert
        command.Should().BeAssignableTo<IAuthorizeableRequest>();
        command.RequiredPermissions.Should().ContainSingle(p => p == Permission.CategoryCreate);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenDataIsValid()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("Member");
        var currentMember = family.Members.First();

        var command = new CreateCategoryCommand("Alimentação", CategoryType.Expense);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();

        _categoryRepositoryMock.Verify(
            repo => repo.AddAsync(It.IsAny<Category>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCurrentUserMemberNotFound()
    {
        // Arrange
        var command = new CreateCategoryCommand("Alimentação", CategoryType.Expense);
        var currentMemberId = Guid.NewGuid();

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMemberId);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMemberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.Members.Member?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("User.MemberNotFound");
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenCreatingValidSubCategory()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("Member");
        var currentMember = family.Members.First();

        var parentCategory = new Category("Alimentação", CategoryType.Expense, family.Id);
        var command = new CreateCategoryCommand("Mercado", CategoryType.Expense, parentCategory.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByIdAsync(parentCategory.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(parentCategory);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();

        _categoryRepositoryMock.Verify(
            repo => repo.AddAsync(It.IsAny<Category>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenParentCategoryNotFound()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("Member");
        var currentMember = family.Members.First();

        var nonExistentParentId = Guid.NewGuid();
        var command = new CreateCategoryCommand("Mercado", CategoryType.Expense, nonExistentParentId);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByIdAsync(nonExistentParentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Category?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Category.ParentNotFound");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenParentCategoryBelongsToDifferentFamily()
    {
        // Arrange
        var family1 = new Family("Silva");
        family1.AddMember("Member");
        var currentMember = family1.Members.First();

        var family2 = new Family("Other");
        var parentCategory = new Category("Alimentação", CategoryType.Expense, family2.Id); // Different Family

        var command = new CreateCategoryCommand("Mercado", CategoryType.Expense, parentCategory.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByIdAsync(parentCategory.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(parentCategory);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Category.AccessDenied");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenParentCategoryIsAlreadyASubCategory()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("Member");
        var currentMember = family.Members.First();

        var grandparentCategory = new Category("Alimentação", CategoryType.Expense, family.Id);
        var parentCategory = new Category("Mercado", CategoryType.Expense, family.Id, grandparentCategory.Id); // Already a subcategory

        var command = new CreateCategoryCommand("Hortifruti", CategoryType.Expense, parentCategory.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByIdAsync(parentCategory.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(parentCategory);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Category.NestingLimitExceeded");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenParentCategoryTypeMismatches()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("Member");
        var currentMember = family.Members.First();

        var parentCategory = new Category("Salário", CategoryType.Income, family.Id); // Income parent
        var command = new CreateCategoryCommand("Mercado", CategoryType.Expense, parentCategory.Id); // Expense subcategory

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByIdAsync(parentCategory.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(parentCategory);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Category.TypeMismatch");
    }
}
