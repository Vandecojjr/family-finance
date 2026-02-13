using Application.Wallets.UseCases.CreatePersonalWallet;
using Domain.Enums;
using FluentValidation.TestHelper;
using Xunit;

namespace Application.Tests.Wallets.UseCases.CreatePersonalWallet;

public class CreatePersonalWalletValidatorTests
{
    private readonly CreatePersonalWalletValidator _validator;

    public CreatePersonalWalletValidatorTests()
    {
        _validator = new CreatePersonalWalletValidator();
    }

    [Fact]
    public void Should_Have_Error_When_Name_Is_Empty()
    {
        var command = new CreatePersonalWalletCommand("", WalletType.Checking, 0);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Should_Have_Error_When_Name_Is_Too_Long()
    {
        var command = new CreatePersonalWalletCommand(new string('a', 81), WalletType.Checking, 0);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Should_Have_Error_When_InitialBalance_Is_Negative()
    {
        var command = new CreatePersonalWalletCommand("Wallet", WalletType.Checking, -1);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.InitialBalance);
    }

    [Fact]
    public void Should_Not_Have_Error_When_Command_Is_Valid()
    {
        var command = new CreatePersonalWalletCommand("My Wallet", WalletType.Checking, 100);
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
