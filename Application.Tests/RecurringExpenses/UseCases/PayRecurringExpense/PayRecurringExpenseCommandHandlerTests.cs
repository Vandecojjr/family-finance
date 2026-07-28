using System.Reflection;
using Application.Shared.Auth;
using Application.UseCases.RecurringExpenses.PayRecurringExpense;
using Domain.Entities.Families;
using Domain.Entities.Categories;
using Domain.Entities.Expenses;
using Domain.Entities.Wallets;
using Domain.Entities.Members;
using Domain.Enums;
using Domain.Repositories;
using Domain.Services;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.RecurringExpenses.UseCases.PayRecurringExpense;

public class PayRecurringExpenseCommandHandlerTests
{
    private readonly Mock<IExpenseRepository> _expenseRepositoryMock;
    private readonly Mock<IWalletRepository> _walletRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly ExpensePaymentService _expensePaymentService;
    private readonly PayRecurringExpenseCommandHandler _handler;

    public PayRecurringExpenseCommandHandlerTests()
    {
        _expenseRepositoryMock = new Mock<IExpenseRepository>();
        _walletRepositoryMock = new Mock<IWalletRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _expensePaymentService = new ExpensePaymentService();
        _handler = new PayRecurringExpenseCommandHandler(
            _expenseRepositoryMock.Object,
            _walletRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object,
            _expensePaymentService);
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
            var field = target.GetType().GetField($"<{name}>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            field?.SetValue(target, value);
        }
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenTargetExpenseAndWalletAreValid()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var category = new Category("Internet", CategoryType.Expense, family.Id);
        
        var expense = Expense.CreateRecurring(
            "Internet Fibra",
            150.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow.AddMonths(-1),
            null,
            currentMember.Id,
            category.Id);
            
        SetPrivateProperty(expense, "Member", currentMember);

        var wallet = new Wallet("Carteira Principal", 1000.00m, family.Id, Guid.NewGuid());

        var command = new PayRecurringExpenseCommand(
            expense.Id,
            wallet.Id,
            150.00m,
            null,
            null,
            null);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(wallet.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallet);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();

        wallet.CashBalance.Value.Should().Be(850.00m); // 1000 - 150
        expense.Payments.Should().ContainSingle();
        expense.Payments.First().AmountPaid.Should().Be(150.00m);

        _walletRepositoryMock.Verify(
            repo => repo.UpdateAsync(wallet, It.IsAny<CancellationToken>()),
            Times.Once);
        _expenseRepositoryMock.Verify(
            repo => repo.UpdateAsync(expense, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenCurrentUserMemberNotFound()
    {
        // Arrange
        var command = new PayRecurringExpenseCommand(
            Guid.NewGuid(),
            Guid.NewGuid(),
            100.00m,
            null,
            null,
            null);

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

        _expenseRepositoryMock.Verify(
            repo => repo.UpdateAsync(It.IsAny<Expense>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _walletRepositoryMock.Verify(
            repo => repo.UpdateAsync(It.IsAny<Wallet>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenExpenseNotFound()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var command = new PayRecurringExpenseCommand(
            Guid.NewGuid(),
            Guid.NewGuid(),
            100.00m,
            null,
            null,
            null);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(command.RecurringExpenseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Expense?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("Expense.NotFound");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenExpenseBelongsToDifferentFamily()
    {
        // Arrange
        var family1 = new Family("Silva");
        family1.AddMember("John Doe");
        var currentMember = family1.Members.First();

        var family2 = new Family("Other");
        family2.AddMember("Jane Doe");
        var otherMember = family2.Members.First();

        var category = new Category("Internet", CategoryType.Expense, family2.Id);
        
        var expense = Expense.CreateRecurring(
            "Internet Fibra",
            150.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow.AddMonths(-1),
            null,
            otherMember.Id,
            category.Id);
            
        SetPrivateProperty(expense, "Member", otherMember);

        var command = new PayRecurringExpenseCommand(
            expense.Id,
            Guid.NewGuid(),
            100.00m,
            null,
            null,
            null);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);

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

        var category = new Category("Internet", CategoryType.Expense, family.Id);
        
        var expense = Expense.CreateRecurring(
            "Internet Fibra",
            150.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow.AddMonths(-1),
            null,
            currentMember.Id,
            category.Id);
            
        SetPrivateProperty(expense, "Member", currentMember);

        var command = new PayRecurringExpenseCommand(
            expense.Id,
            Guid.NewGuid(),
            150.00m,
            null,
            null,
            null);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);
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

        var category = new Category("Internet", CategoryType.Expense, family1.Id);
        
        var expense = Expense.CreateRecurring(
            "Internet Fibra",
            150.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow.AddMonths(-1),
            null,
            currentMember.Id,
            category.Id);
            
        SetPrivateProperty(expense, "Member", currentMember);

        var wallet = new Wallet("Outra Carteira", 1000.00m, family2.Id, Guid.NewGuid());

        var command = new PayRecurringExpenseCommand(
            expense.Id,
            wallet.Id,
            150.00m,
            null,
            null,
            null);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);
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
    public async Task Handle_ShouldReturnFailureResult_WhenExpensePaymentServiceThrowsException()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var category = new Category("Internet", CategoryType.Expense, family.Id);
        
        var expense = Expense.CreateRecurring(
            "Internet Fibra",
            150.00m,
            RecurringExpenseType.Fixed,
            RecurringFrequency.Monthly,
            10,
            DateTime.UtcNow.AddMonths(-1),
            null,
            currentMember.Id,
            category.Id);
            
        SetPrivateProperty(expense, "Member", currentMember);

        // Setup the expense to already have a payment for the current month and year to trigger exception
        var currentMonth = DateTime.UtcNow.Month;
        var currentYear = DateTime.UtcNow.Year;
        expense.Pay(currentMonth, currentYear, 150.00m, DateTime.UtcNow);

        var wallet = new Wallet("Carteira Principal", 1000.00m, family.Id, Guid.NewGuid());

        var command = new PayRecurringExpenseCommand(
            expense.Id,
            wallet.Id,
            150.00m,
            null,
            null,
            null);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _expenseRepositoryMock
            .Setup(repo => repo.GetByIdAsync(expense.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expense);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(wallet.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallet);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle();
        result.Errors[0].Code.Should().Be("RecurringExpense.PaymentError");
    }
}
