using Domain.Enums;

namespace Infrastructure.Queries.Expanses;

public static class AccountsPayableSql
{
    public static SqlQuery GetAllByFamily(Guid familyId, RecurringFrequency onlyDate)
    {
        var dateLogic = GetDateLogic(onlyDate);
        var plannedDateLogic = GetPlannedDateLogic(onlyDate);
        
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
                            INNER JOIN "Members" m on re."MemberId" = m."Id"
                            LEFT JOIN "ExpensePayments" p on re."Id" = p."ExpenseId"
                               {{dateLogic}}
                   WHERE m."FamilyId" = {0}
                     AND re."Frequency" = {1}
                     AND re."Type" = 2
                     AND p."Id" IS NULL
                     
                   UNION ALL
                   
                   SELECT
                       re."Id",
                       re."Description",
                       re."Amount",
                       CAST({1} AS integer) as "Frequency",
                       c."Name" as CategoryName,
                       CAST(EXTRACT(DAY FROM re."Date") AS integer) as "DueDay",
                       CASE
                           WHEN CURRENT_DATE > re."Date" THEN true
                           ELSE false
                        END AS IsLate
                   FROM "Expenses" re
                            INNER JOIN "Categories" c on re."CategoryId" = c."Id"
                            INNER JOIN "Members" m on re."MemberId" = m."Id"
                            LEFT JOIN "ExpensePayments" p on re."Id" = p."ExpenseId"
                   WHERE m."FamilyId" = {0}
                     AND re."Type" = 1
                     AND p."Id" IS NULL
                     {{plannedDateLogic}}
                   """;

        var sqlResult = new SqlQuery(sql, familyId);
        sqlResult.AddParameter(onlyDate);
        
        return sqlResult;
    }

    private static string GetDateLogic(RecurringFrequency onlyDate)
    {
        return onlyDate switch
        {
            RecurringFrequency.Weekly => "AND EXTRACT(WEEK FROM p.\"PaidAt\") = EXTRACT(WEEK FROM CURRENT_DATE)",
            RecurringFrequency.Monthly => "AND EXTRACT(MONTH FROM p.\"PaidAt\") = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM p.\"PaidAt\") = EXTRACT(YEAR FROM CURRENT_DATE)",
            RecurringFrequency.Yearly => "AND EXTRACT(YEAR FROM p.\"PaidAt\") = EXTRACT(YEAR FROM CURRENT_DATE)",
            _ => string.Empty
        };
    }

    private static string GetPlannedDateLogic(RecurringFrequency onlyDate)
    {
        return onlyDate switch
        {
            RecurringFrequency.Weekly => "AND EXTRACT(WEEK FROM re.\"Date\") = EXTRACT(WEEK FROM CURRENT_DATE)",
            RecurringFrequency.Monthly => "AND EXTRACT(MONTH FROM re.\"Date\") = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM re.\"Date\") = EXTRACT(YEAR FROM CURRENT_DATE)",
            RecurringFrequency.Yearly => "AND EXTRACT(YEAR FROM re.\"Date\") = EXTRACT(YEAR FROM CURRENT_DATE)",
            _ => string.Empty
        };
    }
}