using Domain.Shared.Entities;

namespace Domain.Entities.Wallets;

public class Card : Entity
{
    public string Name { get; private set; } = string.Empty;
    public decimal Limit { get; private set; }
    public decimal UsedLimit { get; private set; }
    public int ClosingDay { get; private set; }
    public int DueDay { get; private set; }
    
    public Guid AccountId { get; private set; }
    public virtual Account? Account { get; private set; }

    protected Card() { }

    public Card(string name, decimal limit, int closingDay, int dueDay, Guid accountId)
    {
        if (limit < 0) 
            throw new ArgumentException("O limite não pode ser negativo.");
        
        if (closingDay < 1 || closingDay > 31) 
            throw new ArgumentException("Dia de fechamento inválido.");
        
        if (dueDay < 1 || dueDay > 31) 
            throw new ArgumentException("Dia de vencimento inválido.");

        Name = name;
        Limit = limit;
        ClosingDay = closingDay;
        DueDay = dueDay;
        AccountId = accountId;
    }

    public void AddSpending(decimal amount) => UsedLimit += amount;
}
