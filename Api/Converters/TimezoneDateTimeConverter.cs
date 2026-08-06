using System.Text.Json;
using System.Text.Json.Serialization;
using Application.Shared.Providers;
using Microsoft.Extensions.DependencyInjection;

namespace Api.Converters;

public class TimezoneDateTimeConverter : JsonConverter<DateTime>
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TimezoneDateTimeConverter(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var rawDate = reader.GetDateTime();
        
        var dateTimeProvider = _httpContextAccessor.HttpContext?.RequestServices.GetService<IDateTimeProvider>();
        
        if (dateTimeProvider != null)
        {
            return dateTimeProvider.ConvertToUtc(rawDate);
        }

        return rawDate;
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        var dateTimeProvider = _httpContextAccessor.HttpContext?.RequestServices.GetService<IDateTimeProvider>();

        if (dateTimeProvider != null)
        {
            var localDate = dateTimeProvider.ConvertToLocal(value);
            // Write as ISO 8601 without 'Z' if we want it to be considered local by the frontend, 
            // or just write the raw value. 
            writer.WriteStringValue(localDate.ToString("yyyy-MM-ddTHH:mm:ss.FFF"));
        }
        else
        {
            writer.WriteStringValue(value);
        }
    }
}
