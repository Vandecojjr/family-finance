using Domain.Enums;

namespace Infrastructure.Queries.Expanses;

public static class AccountsPayableSql
{
    public static SqlQuery GetAllByMember(Guid memberId, RecurringFrequency onlyDate)
    {
        var dateLogic = GetDateLogic(onlyDate);
        
        var sql = $$"""
                   SELECT
                       re."Id",
                       re."Description",
                       re."Amount",
                       re."Frequency",
                       c."Name" as CategoryName,
                       re."DueDay",
                       CASE
                           WHEN EXTRACT(DAY FROM CURRENT_DATE) > re."DueDay" THEN true
                           ELSE false
                        END AS IsLate
                   FROM "Expenses" re
                            INNER JOIN "Categories" c on re."CategoryId" = c."Id"
                            LEFT JOIN "ExpensePayments" p on re."Id" = p."ExpenseId"
                               {{dateLogic}}
                   WHERE re."MemberId" = {0}
                     AND re."Frequency" = {1}
                     AND re."Type" = 2
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