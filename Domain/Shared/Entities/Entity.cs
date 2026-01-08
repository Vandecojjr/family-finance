namespace Domain.Shared.Entities;

public abstract class Entity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; private set; }  = DateTime.UtcNow;
    public DateTime UpdatedAt { get; private set; }
    
    public void SeUpdate()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}