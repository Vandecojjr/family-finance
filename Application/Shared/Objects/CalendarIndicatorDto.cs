namespace Application.Shared.Objects;

public class CalendarDayDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Type { get; set; } = null!; // "payable" or "receivable"
    public bool IsPaid { get; set; }
}

public class CalendarIndicatorDto
{
    public string Date { get; set; } = null!;
    public bool HasPayable { get; set; }
    public bool HasReceivable { get; set; }
    public List<CalendarDayDetailDto> Details { get; set; } = [];
}
