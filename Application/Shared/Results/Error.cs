namespace Application.Shared.Results;

public sealed record Error(string Code, string Message)
{
    public static readonly Error None = new("NONE", string.Empty);
}
