using System.Text.Json;
using System.Text.Json.Serialization;
using Application.Shared.Providers;
using Microsoft.Extensions.DependencyInjection;

namespace Api.Converters;

public class TimezoneNullableDateTimeConverter : JsonConverter<DateTime?>
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TimezoneNullableDateTimeConverter(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;

        var rawDate = reader.GetDateTime();
        
        var dateTimeProvider = _httpContextAccessor.HttpContext?.RequestServices.GetService<IDateTimeProvider>();
        
        if (dateTimeProvider != null)
        {
            return dateTimeProvider.ConvertToUtc(rawDate);
        }

        return rawDate;
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (!value.HasValue)
        {
            writer.WriteNullValue();
            return;
        }

        var dateTimeProvider = _httpContextAccessor.HttpContext?.RequestServices.GetService<IDateTimeProvider>();

        if (dateTimeProvider != null)
        {
            var localDate = dateTimeProvider.ConvertToLocal(value.Value);
            writer.WriteStringValue(localDate.ToString("yyyy-MM-ddTHH:mm:ss.FFF"));
        }
        else
        {
            writer.WriteStringValue(value.Value);
        }
    }
}
