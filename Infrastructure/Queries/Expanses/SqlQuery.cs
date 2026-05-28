namespace Infrastructure.Queries.Expanses;

public sealed class SqlQuery
{
    public string Sql { get; private set; } = string.Empty;
    public object[] Parameters { get; private set; } = [];
    
    public SqlQuery(string sql, object[] parameters)
    {
        Sql = sql;
        Parameters = parameters;
    }
    
    public SqlQuery(string sql, object parameter)
    {
        Sql = sql;
        Parameters = [parameter];
    }
    
    public SqlQuery(string sql)
    {
        Sql = sql;
    }
    
    public SqlQuery()
    {
    }
    
    public void AddParameter(object value)
    {
        Parameters = Parameters.Append(value).ToArray();
    }
}