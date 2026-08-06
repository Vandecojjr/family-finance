namespace Application.Shared.Providers;

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
    DateTime GetLocalNow();
    DateTime ConvertToLocal(DateTime utcDateTime);
    DateTime ConvertToUtc(DateTime localDateTime);
}
