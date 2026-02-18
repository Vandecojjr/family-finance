using Application.Categories.UseCases.CreateCategory;
using Domain.Enums;
using FluentValidation.TestHelper;
using Xunit;

namespace Application.Tests.Categories.UseCases.CreateCategory;

public class CreateCategoryValidatorTests
{
    private readonly CreateCategoryValidator _validator = new();

    [Fact]
    public void Should_HaveError_When_NameIsEmpty()
    {
        var command = new CreateCategoryCommand("", CategoryType.Expense, Guid.NewGuid());
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Should_HaveError_When_NameIsTooLong()
    {
        var command = new CreateCategoryCommand(new string('a', 101), CategoryType.Expense, Guid.NewGuid());
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Should_NotHaveError_When_CommandIsValid()
    {
        var command = new CreateCategoryCommand("Valid Name", CategoryType.Expense, Guid.NewGuid());
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
