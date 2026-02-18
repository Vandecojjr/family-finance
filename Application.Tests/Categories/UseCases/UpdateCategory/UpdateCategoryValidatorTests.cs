using Application.Categories.UseCases.UpdateCategory;
using Domain.Enums;
using FluentValidation.TestHelper;
using Xunit;

namespace Application.Tests.Categories.UseCases.UpdateCategory;

public class UpdateCategoryValidatorTests
{
    private readonly UpdateCategoryValidator _validator = new();

    [Fact]
    public void Should_HaveError_When_IdIsEmpty()
    {
        var command = new UpdateCategoryCommand(Guid.Empty, "Name", CategoryType.Expense);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Id);
    }

    [Fact]
    public void Should_HaveError_When_NameIsEmpty()
    {
        var command = new UpdateCategoryCommand(Guid.NewGuid(), "", CategoryType.Expense);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Should_NotHaveError_When_CommandIsValid()
    {
        var command = new UpdateCategoryCommand(Guid.NewGuid(), "Valid Name", CategoryType.Expense);
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
