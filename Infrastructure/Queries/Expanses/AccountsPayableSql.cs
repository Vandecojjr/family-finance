using Domain.Enums;

namespace Infrastructure.Queries.Expanses;

public static class AccountsPayableSql
{
    public static SqlQuery GetAllByMember(Guid memberId, RecurringFrequency onlyDate)
    {
        var dateLogic = GetDateLogic(onlyDate);
        
        var sql = $$"""
                   SELECT
                       re."Description",
                       re."Amount",
                       re."Frequency",
                       c."Name" as CategoryName
                   FROM "RecurringExpenses" re
                            INNER JOIN "Categories" c on re."CategoryId" = c."Id"
                            LEFT JOIN "RecurringExpensePayments" p on re."Id" = p."RecurringExpenseId"
                               {{dateLogic}}
                   WHERE re."MemberId" = {0}
                     AND re."Frequency" = {1}
                     AND p."Id" IS NULL
                   """;

        var sqlResult = new SqlQuery(sql, memberId);
        sqlResult.AddParameter(onlyDate);
        
        return sqlResult;
    }

    private static string GetDateLogic(RecurringFrequency onlyDate)
    {
        return onlyDate switch
        {
            RecurringFrequency.Weekly => "AND EXTRACT(WEEK FROM p.\"PaidAt\") = EXTRACT(WEEK FROM CURRENT_DATE)",
            RecurringFrequency.Monthly => "AND EXTRACT(MONTH FROM p.\"PaidAt\") = EXTRACT(MONTH FROM CURRENT_DATE)",
            RecurringFrequency.Yearly => "AND EXTRACT(YEAR FROM p.\"PaidAt\") = EXTRACT(YEAR FROM CURRENT_DATE)",
            _ => string.Empty
        };
    }
}