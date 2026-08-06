using Application.Shared.Auth;
using Application.Shared.Providers;

namespace Infrastructure.Providers;

public sealed class DateTimeProvider(ICurrentUser currentUser) : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;

    private TimeZoneInfo GetUserTimeZone()
    {
        var timezoneId = currentUser.Timezone;
        if (string.IsNullOrWhiteSpace(timezoneId))
        {
            timezoneId = "E. South America Standard Time"; // Windows timezone for America/Sao_Paulo fallback
        }

        try
        {
            // First try finding the timezone directly (e.g. if running on Linux with IANA or Windows with Windows ID)
            return TimeZoneInfo.FindSystemTimeZoneById(timezoneId);
        }
        catch (TimeZoneNotFoundException)
        {
            try
            {
                // Fallback attempt for cross-platform (IANA <-> Windows)
                // This is a naive fallback, for robust solutions a library like TimeZoneConverter is recommended.
                if (timezoneId == "America/Sao_Paulo")
                    return TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
                
                return TimeZoneInfo.Local;
            }
            catch
            {
                return TimeZoneInfo.Local;
            }
        }
        catch (InvalidTimeZoneException)
        {
            return TimeZoneInfo.Local;
        }
    }

    public DateTime GetLocalNow()
    {
        var userTimeZone = GetUserTimeZone();
        return TimeZoneInfo.ConvertTimeFromUtc(UtcNow, userTimeZone);
    }

    public DateTime ConvertToLocal(DateTime utcDateTime)
    {
        if (utcDateTime.Kind == DateTimeKind.Local)
            return utcDateTime;

        var userTimeZone = GetUserTimeZone();
        return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, userTimeZone);
    }

    public DateTime ConvertToUtc(DateTime localDateTime)
    {
        if (localDateTime.Kind == DateTimeKind.Utc)
            return localDateTime;

        var userTimeZone = GetUserTimeZone();
        return TimeZoneInfo.ConvertTimeToUtc(localDateTime, userTimeZone);
    }
}
