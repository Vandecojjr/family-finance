using System.Data;

namespace Infrastructure.Data;

public interface ISqlConnectionFactory
{
    IDbConnection CreateConnection();
}
