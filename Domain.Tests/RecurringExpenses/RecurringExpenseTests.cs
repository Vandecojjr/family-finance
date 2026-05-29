using Domain.Entities.Expenses;
using Domain.Entities.Expenses.Exceptions;
using Domain.Enums;
using Xunit;

namespace Domain.Tests.Expenses;

public class ExpenseTests
{
    [Fact]
    public void Expense_ShouldCreate_WhenValuesAreValid()
    {
        // Arrange
        var description = "Netflix";
        var amount = 55.90m;
        var type = RecurringExpenseType.Fixed;
        var frequency = RecurringFrequency.Monthly;
        var dueDay = 10;
        var startDate = DateTime.UtcNow.Date;
        DateTime? endDate = null;
        var memberId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();

        // Act
        var expense = Expense.CreateRecurring(
            description,
            amount,
            type,
            frequency,
            dueDay,
            startDate,
            endDate,
            memberId,
            categoryId);

        // Assert
        Assert.Equal(description, expense.Description.Value);
        Assert.Equal(amount, expense.Amount.Value);
        Assert.Equal(ExpenseType.Recurring, expense.Type);
        Assert.Equal(type, expense.RecurringType);
        Assert.Equal(frequency, expense.Frequency);
        Assert.NotNull(expense.DueDay);
        Assert.Equal(dueDay, expense.DueDay.Value);
        Assert.NotNull(expense.Period);
        Assert.Equal(startDate, expense.Period.StartDate);
        Assert.Null(expense.Period.EndDate);
        Assert.NotNull(expense.Status);
        Assert.True(expense.Status.IsActive);
        Assert.Equal(memberId, expense.MemberId);
        Assert.Equal(categoryId, expense.CategoryId);
    }

    [Fact]
    public void Constructor_ShouldThrowExpenseDescriptionRequiredException_WhenDescriptionIsNull()
    {
        Assert.Throws<ExpenseDescriptionRequiredException>(() => Expense.CreateRecurring(
            null!, 100m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, 15, DateTime.UtcNow, null, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_ShouldThrowExpenseDescriptionRequiredException_WhenDescriptionIsEmpty()
    {
        Assert.Throws<ExpenseDescriptionRequiredException>(() => Expense.CreateRecurring(
            "", 100m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, 15, DateTime.UtcNow, null, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_ShouldThrowExpenseDescriptionTooLongException_WhenDescriptionExceedsLimit()
    {
        var longDesc = new string('a', 201);
        Assert.Throws<ExpenseDescriptionTooLongException>(() => Expense.CreateRecurring(
            longDesc, 100m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, 15, DateTime.UtcNow, null, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_ShouldThrowExpenseAmountException_WhenAmountIsNegative()
    {
        Assert.Throws<ExpenseAmountException>(() => Expense.CreateRecurring(
            "Netflix", -10m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, 15, DateTime.UtcNow, null, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(32)]
    public void Constructor_ShouldThrowInvalidDueDayException_WhenDueDayIsInvalid(int invalidDueDay)
    {
        Assert.Throws<InvalidDueDayException>(() => Expense.CreateRecurring(
            "Netflix", 50m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, invalidDueDay, DateTime.UtcNow, null, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_ShouldThrowInvalidRecurringPeriodException_WhenEndDateIsBeforeStartDate()
    {
        var startDate = DateTime.UtcNow;
        var endDate = startDate.AddDays(-1);

        Assert.Throws<InvalidRecurringPeriodException>(() => Expense.CreateRecurring(
            "Netflix", 50m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, 15, startDate, endDate, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public void Update_ShouldModifyProperties_AndSetUpdatedAt()
    {
        // Arrange
        var categoryId = Guid.NewGuid();
        var expense = Expense.CreateRecurring(
            "Netflix", 55.90m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, 10, DateTime.UtcNow, null, Guid.NewGuid(), categoryId);

        var newDescription = "Amazon Prime";
        var newAmount = 19.90m;
        var newType = RecurringExpenseType.Variable;
        var newFrequency = RecurringFrequency.Yearly;
        var newDueDay = 5;
        var newStartDate = DateTime.UtcNow.AddDays(1);
        var newEndDate = DateTime.UtcNow.AddMonths(12);
        var newCategoryId = Guid.NewGuid();

        // Act
        expense.UpdateRecurring(
            newDescription,
            newAmount,
            newType,
            newFrequency,
            newDueDay,
            newStartDate,
            newEndDate,
            newCategoryId);

        // Assert
        Assert.Equal(newDescription, expense.Description.Value);
        Assert.Equal(newAmount, expense.Amount.Value);
        Assert.Equal(ExpenseType.Recurring, expense.Type);
        Assert.Equal(newType, expense.RecurringType);
        Assert.Equal(newFrequency, expense.Frequency);
        Assert.NotNull(expense.DueDay);
        Assert.Equal(newDueDay, expense.DueDay.Value);
        Assert.NotNull(expense.Period);
        Assert.Equal(newStartDate, expense.Period.StartDate);
        Assert.Equal(newEndDate, expense.Period.EndDate);
        Assert.Equal(newCategoryId, expense.CategoryId);
        Assert.True(expense.UpdatedAt > DateTime.MinValue);
    }
}


