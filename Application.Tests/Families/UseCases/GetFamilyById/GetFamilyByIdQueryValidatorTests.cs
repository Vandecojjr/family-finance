using Application.UseCases.Families.GetFamilyById;
using FluentValidation.TestHelper;
using Xunit;

namespace Application.Tests.Families.UseCases.GetFamilyById;

public class GetFamilyByIdQueryValidatorTests
{
    private readonly GetFamilyByIdQueryValidator _validator = new();

    [Fact]
    public void Should_Pass_When_Id_Is_Not_Empty()
    {
        var query = new GetFamilyByIdQuery(Guid.NewGuid());
        var result = _validator.TestValidate(query);
        result.ShouldNotHaveValidationErrorFor(x => x.Id);
    }

    [Fact]
    public void Should_Fail_When_Id_Is_Empty()
    {
        var query = new GetFamilyByIdQuery(Guid.Empty);
        var result = _validator.TestValidate(query);
        result.ShouldHaveValidationErrorFor(x => x.Id)
            .WithErrorMessage("O ID da família é obrigatório.");
    }
}


