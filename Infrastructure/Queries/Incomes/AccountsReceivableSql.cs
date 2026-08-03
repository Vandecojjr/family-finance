using Domain.Enums;
using Infrastructure.Queries.Expanses;

namespace Infrastructure.Queries.Incomes;

public static class AccountsReceivableSql
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
                   FROM "Incomes" re
                            INNER JOIN "Categories" c on re."CategoryId" = c."Id"
                            INNER JOIN "Members" m on re."MemberId" = m."Id"
                            LEFT JOIN "IncomePayments" p on re."Id" = p."IncomeId"
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
                   FROM "Incomes" re
                            INNER JOIN "Categories" c on re."CategoryId" = c."Id"
                            INNER JOIN "Members" m on re."MemberId" = m."Id"
                            LEFT JOIN "IncomePayments" p on re."Id" = p."IncomeId"
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
            RecurringFrequency.Weekly => "AND EXTRACT(WEEK FROM p.\"ReceivedAt\") = EXTRACT(WEEK FROM CURRENT_DATE)",
            RecurringFrequency.Monthly => "AND EXTRACT(MONTH FROM p.\"ReceivedAt\") = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM p.\"ReceivedAt\") = EXTRACT(YEAR FROM CURRENT_DATE)",
            RecurringFrequency.Yearly => "AND EXTRACT(YEAR FROM p.\"ReceivedAt\") = EXTRACT(YEAR FROM CURRENT_DATE)",
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
