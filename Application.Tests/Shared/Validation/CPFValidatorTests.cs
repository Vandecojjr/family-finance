using Application.Shared.Validation;
using FluentValidation;
using FluentValidation.TestHelper;
using Xunit;

namespace Application.Tests.Shared.Validation;

public class CPFValidatorTests
{
    private readonly TestValidator _validator = new();

    [Theory]
    [InlineData("123.456.789-09")] // Standard valid
    [InlineData("12345678909")]    // No formatting
    [InlineData("00000000191")]    // Leading zeros
    [InlineData("45960165007")]    // Manually verified
    public void Should_Pass_When_CPF_Is_Valid(string cpf)
    {
        var result = _validator.TestValidate(new TestRequest(cpf));
        result.ShouldNotHaveValidationErrorFor(x => x.Document);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("123")]
    [InlineData("12345678901")] // Invalid checksum
    [InlineData("11111111111")] // All same digits
    [InlineData("22222222222")]
    [InlineData("ABC.DEF.GHI-JK")]
    public void Should_Fail_When_CPF_Is_Invalid(string? cpf)
    {
        var result = _validator.TestValidate(new TestRequest(cpf ?? string.Empty));
        result.ShouldHaveValidationErrorFor(x => x.Document)
            .WithErrorMessage("O CPF informado é inválido.");
    }

    private class TestRequest(string document)
    {
        public string Document { get; } = document;
    }

    private class TestValidator : AbstractValidator<TestRequest>
    {
        public TestValidator()
        {
            RuleFor(x => x.Document).MustBeCpf();
        }
    }
}
