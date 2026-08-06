using System.Reflection;
using Application.Shared.Auth;
using Application.UseCases.RecurringIncomes.ReceiveRecurringIncome;
using Domain.Entities.Families;
using Domain.Entities.Categories;
using Domain.Entities.Incomes;
using Domain.Entities.Wallets;
using Domain.Entities.Members;
using Domain.Enums;
using Domain.Repositories;
using Domain.Services;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.RecurringIncomes.UseCases.ReceiveRecurringIncome;

public class ReceiveRecurringIncomeCommandHandlerTests
{
    private readonly Mock<IIncomeRepository> _incomeRepositoryMock;
    private readonly Mock<IWalletRepository> _walletRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly IncomePaymentService _incomePaymentService;
    private readonly ReceiveRecurringIncomeCommandHandler _handler;

    public ReceiveRecurringIncomeCommandHandlerTests()
    {
        _incomeRepositoryMock = new Mock<IIncomeRepository>();
        _walletRepositoryMock = new Mock<IWalletRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _incomePaymentService = new IncomePaymentService();
        
        _handler = new ReceiveRecurringIncomeCommandHandler(
            _incomeRepositoryMock.Object,
            _walletRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object,
            _incomePaymentService);
    }

    private static void SetPrivateProperty(object target, string name, object value)
    {
        var property = target.GetType().GetProperty(name, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
        if (property != null && property.CanWrite)
        {
            property.SetValue(target, value);
        }
        else
        {
            // If the property has a private setter or read-only, set backing field or set value directly
            var field = target.GetType().GetField($"<{name}>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            field?.SetValue(target, value);
        }
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenTargetIncomeAndWalletAreValid()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var category = new Category("Salário", CategoryType.Income, family.Id);
        
        var income = Income.CreateRecurring(
            "Salário Mensal",
            5000.00m,
            RecurringIncomeType.Fixed,
            RecurringFrequency.Monthly,
            5,
            DateTime.UtcNow.AddMonths(-1),
            null,
            currentMember.Id,
            category.Id);
            
        SetPrivateProperty(income, "Member", currentMember);

        var wallet = new Wallet("Carteira Principal", 1000.00m, family.Id, Guid.NewGuid());

        var command = new ReceiveRecurringIncomeCommand(
            income.Id,
            wallet.Id,
            5000.00m);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _incomeRepositoryMock
            .Setup(repo => repo.GetByIdAsync(income.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(income);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(wallet.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallet);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();

        wallet.CashBalance.Value.Should().Be(6000.00m); // 1000 + 5000
        income.Payments.Should().ContainSingle();
        income.Payments.First().AmountReceived.Should().Be(5000.00m);

        _walletRepositoryMock.Verify(
            repo => repo.UpdateAsync(wallet, It.IsAny<CancellationToken>()),
            Times.Once);
        _incomeRepositoryMock.Verify(
            repo => repo.UpdateAsync(income, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCurrentUserMemberNotFound()
    {
        // Arrange
        var command = new ReceiveRecurringIncomeCommand(
            Guid.NewGuid(),
            Guid.NewGuid(),
            100.00m);

        var currentMemberId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.MemberId).Returns(currentMemberId);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMemberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Member?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("User.MemberNotFound");

        _incomeRepositoryMock.Verify(
            repo => repo.UpdateAsync(It.IsAny<Income>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _walletRepositoryMock.Verify(
            repo => repo.UpdateAsync(It.IsAny<Wallet>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenIncomeNotFound()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var command = new ReceiveRecurringIncomeCommand(
            Guid.NewGuid(),
            Guid.NewGuid(),
            100.00m);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _incomeRepositoryMock
            .Setup(repo => repo.GetByIdAsync(command.RecurringIncomeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Income?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Income.NotFound");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenIncomeBelongsToDifferentFamily()
    {
        // Arrange
        var family1 = new Family("Silva");
        family1.AddMember("John Doe");
        var currentMember = family1.Members.First();

        var family2 = new Family("Other");
        family2.AddMember("Jane Doe");
        var otherMember = family2.Members.First();

        var category = new Category("Salário", CategoryType.Income, family2.Id);
        
        var income = Income.CreateRecurring(
            "Salário Outro",
            5000.00m,
            RecurringIncomeType.Fixed,
            RecurringFrequency.Monthly,
            5,
            DateTime.UtcNow.AddMonths(-1),
            null,
            otherMember.Id,
            category.Id);
            
        SetPrivateProperty(income, "Member", otherMember);

        var command = new ReceiveRecurringIncomeCommand(
            income.Id,
            Guid.NewGuid(),
            100.00m);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _incomeRepositoryMock
            .Setup(repo => repo.GetByIdAsync(income.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(income);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Family.AccessDenied");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenWalletNotFound()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var category = new Category("Salário", CategoryType.Income, family.Id);
        
        var income = Income.CreateRecurring(
            "Salário Mensal",
            5000.00m,
            RecurringIncomeType.Fixed,
            RecurringFrequency.Monthly,
            5,
            DateTime.UtcNow.AddMonths(-1),
            null,
            currentMember.Id,
            category.Id);
            
        SetPrivateProperty(income, "Member", currentMember);

        var command = new ReceiveRecurringIncomeCommand(
            income.Id,
            Guid.NewGuid(),
            5000.00m);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _incomeRepositoryMock
            .Setup(repo => repo.GetByIdAsync(income.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(income);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(command.WalletId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Wallet?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Wallet.NotFound");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenWalletBelongsToDifferentFamily()
    {
        // Arrange
        var family1 = new Family("Silva");
        family1.AddMember("John Doe");
        var currentMember = family1.Members.First();

        var family2 = new Family("Other");

        var category = new Category("Salário", CategoryType.Income, family1.Id);
        
        var income = Income.CreateRecurring(
            "Salário Mensal",
            5000.00m,
            RecurringIncomeType.Fixed,
            RecurringFrequency.Monthly,
            5,
            DateTime.UtcNow.AddMonths(-1),
            null,
            currentMember.Id,
            category.Id);
            
        SetPrivateProperty(income, "Member", currentMember);

        var wallet = new Wallet("Outra Carteira", 1000.00m, family2.Id, Guid.NewGuid());

        var command = new ReceiveRecurringIncomeCommand(
            income.Id,
            wallet.Id,
            5000.00m);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _incomeRepositoryMock
            .Setup(repo => repo.GetByIdAsync(income.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(income);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(wallet.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallet);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Family.AccessDenied");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenIncomePaymentServiceThrowsException()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var category = new Category("Salário", CategoryType.Income, family.Id);
        
        var income = Income.CreateRecurring(
            "Salário Mensal",
            5000.00m,
            RecurringIncomeType.Fixed,
            RecurringFrequency.Monthly,
            5,
            DateTime.UtcNow.AddMonths(-1),
            null,
            currentMember.Id,
            category.Id);
            
        SetPrivateProperty(income, "Member", currentMember);

        // Setup the income to already have a payment for the current month and year to trigger exception
        var currentMonth = DateTime.UtcNow.Month;
        var currentYear = DateTime.UtcNow.Year;
        income.Receive(currentMonth, currentYear, 5000.00m, DateTime.UtcNow);

        var wallet = new Wallet("Carteira Principal", 1000.00m, family.Id, Guid.NewGuid());

        var command = new ReceiveRecurringIncomeCommand(
            income.Id,
            wallet.Id,
            5000.00m);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _incomeRepositoryMock
            .Setup(repo => repo.GetByIdAsync(income.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(income);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(wallet.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallet);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("RecurringIncome.PaymentError");
    }
}
