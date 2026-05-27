using Domain.Entities.Categories;
using Domain.Entities.Members;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.PlannedIncomes;

public class PlannedIncome : Entity, IAggregateRoot
{
    public string Description { get; private set; } = null!;
    public decimal Amount { get; private set; }
    public DateTime Date { get; private set; }
    public Guid MemberId { get; private set; }
    public Guid CategoryId { get; private set; }

    public virtual Member Member { get; private set; } = null!;
    public virtual Category Category { get; private set; } = null!;

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected PlannedIncome()
    {
    }
    #pragma warning restore CS8618

    public PlannedIncome(
        string description,
        decimal amount,
        DateTime date,
        Guid memberId,
        Guid categoryId)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("A descrição é obrigatória.", nameof(description));
        if (description.Length > 200)
            throw new ArgumentException("A descrição deve ter no máximo 200 caracteres.", nameof(description));
        if (amount < 0)
            throw new ArgumentException("O valor deve ser maior ou igual a zero.", nameof(amount));

        Description = description.Trim();
        Amount = amount;
        Date = date;
        MemberId = memberId;
        CategoryId = categoryId;
    }

    public void Update(
        string description,
        decimal amount,
        DateTime date,
        Guid categoryId)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("A descrição é obrigatória.", nameof(description));
        if (description.Length > 200)
            throw new ArgumentException("A descrição deve ter no máximo 200 caracteres.", nameof(description));
        if (amount < 0)
            throw new ArgumentException("O valor deve ser maior ou igual a zero.", nameof(amount));

        Description = description.Trim();
        Amount = amount;
        Date = date;
        CategoryId = categoryId;
        SeUpdate();
    }
}
