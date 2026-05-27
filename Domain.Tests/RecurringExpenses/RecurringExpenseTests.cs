using Domain.Entities.RecurringExpenses;
using Domain.Entities.RecurringExpenses.Exceptions;
using Domain.Enums;
using Xunit;

namespace Domain.Tests.RecurringExpenses;

public class RecurringExpenseTests
{
    [Fact]
    public void RecurringExpense_ShouldCreate_WhenValuesAreValid()
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
        var expense = new RecurringExpense(
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
        Assert.Equal(type, expense.Type);
        Assert.Equal(frequency, expense.Frequency);
        Assert.Equal(dueDay, expense.DueDay.Value);
        Assert.Equal(startDate, expense.Period.StartDate);
        Assert.Null(expense.Period.EndDate);
        Assert.True(expense.Status.IsActive);
        Assert.Equal(memberId, expense.MemberId);
        Assert.Equal(categoryId, expense.CategoryId);
    }

    [Fact]
    public void Constructor_ShouldThrowDescriptionRequiredException_WhenDescriptionIsNull()
    {
        Assert.Throws<DescriptionRequiredException>(() => new RecurringExpense(
            null!, 100m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, 15, DateTime.UtcNow, null, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_ShouldThrowDescriptionRequiredException_WhenDescriptionIsEmpty()
    {
        Assert.Throws<DescriptionRequiredException>(() => new RecurringExpense(
            "", 100m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, 15, DateTime.UtcNow, null, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_ShouldThrowDescriptionTooLongException_WhenDescriptionExceedsLimit()
    {
        var longDesc = new string('a', 201);
        Assert.Throws<DescriptionTooLongException>(() => new RecurringExpense(
            longDesc, 100m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, 15, DateTime.UtcNow, null, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_ShouldThrowInvalidAmountException_WhenAmountIsNegative()
    {
        Assert.Throws<InvalidAmountException>(() => new RecurringExpense(
            "Netflix", -10m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, 15, DateTime.UtcNow, null, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(32)]
    public void Constructor_ShouldThrowInvalidDueDayException_WhenDueDayIsInvalid(int invalidDueDay)
    {
        Assert.Throws<InvalidDueDayException>(() => new RecurringExpense(
            "Netflix", 50m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, invalidDueDay, DateTime.UtcNow, null, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_ShouldThrowInvalidPeriodException_WhenEndDateIsBeforeStartDate()
    {
        var startDate = DateTime.UtcNow;
        var endDate = startDate.AddDays(-1);

        Assert.Throws<InvalidPeriodException>(() => new RecurringExpense(
            "Netflix", 50m, RecurringExpenseType.Fixed, RecurringFrequency.Monthly, 15, startDate, endDate, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public void Update_ShouldModifyProperties_AndSetUpdatedAt()
    {
        // Arrange
        var categoryId = Guid.NewGuid();
        var expense = new RecurringExpense(
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
        expense.Update(
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
        Assert.Equal(newType, expense.Type);
        Assert.Equal(newFrequency, expense.Frequency);
        Assert.Equal(newDueDay, expense.DueDay.Value);
        Assert.Equal(newStartDate, expense.Period.StartDate);
        Assert.Equal(newEndDate, expense.Period.EndDate);
        Assert.Equal(newCategoryId, expense.CategoryId);
        Assert.True(expense.UpdatedAt > DateTime.MinValue);
    }
}
