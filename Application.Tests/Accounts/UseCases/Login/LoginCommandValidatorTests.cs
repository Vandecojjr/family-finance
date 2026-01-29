using Application.Accounts.UseCases.Login;
using FluentAssertions;
using Xunit;

namespace Application.Tests.Accounts.UseCases.Login;

public class LoginCommandValidatorTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Should_Fail_When_Email_Is_Empty(string? email)
    {
        var validator = new LoginCommandValidator();
        var result = validator.Validate(new LoginCommand(email ?? string.Empty, "123456"));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(LoginCommand.Email));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("12345")] // menor que 6
    public void Should_Fail_When_Password_Is_Invalid(string? password)
    {
        var validator = new LoginCommandValidator();
        var result = validator.Validate(new LoginCommand("user@mail.com", password ?? string.Empty));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(LoginCommand.Password));
    }

    [Fact]
    public void Should_Pass_When_Data_Is_Valid()
    {
        var validator = new LoginCommandValidator();
        var result = validator.Validate(new LoginCommand("user@mail.com", "123456"));

        result.IsValid.Should().BeTrue();
    }
}
