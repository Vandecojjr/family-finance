namespace Infrastructure.Queries.Expanses.Dashboard;

public static class DashboardQuerySql
{
    public static SqlQuery GetDashboard(Guid familyId)
    {
        var sql = """
                  SELECT
                  -- 1. Total Expensed
                  (SELECT COALESCE(SUM(t."Amount"), 0)
                   FROM "Transactions" t
                            INNER JOIN "Wallets" tw ON tw."Id" = t."WalletId"
                   WHERE t."Type" = 2
                     AND EXTRACT(MONTH FROM t."Date") = EXTRACT(MONTH FROM CURRENT_DATE)
                     AND EXTRACT(YEAR FROM t."Date") = EXTRACT(YEAR FROM CURRENT_DATE)
                     AND tw."FamilyId" = @FamilyId) AS "TotalExpensed",

                  -- 2. Total Incomed
                  (SELECT COALESCE(SUM(t."Amount"), 0)
                   FROM "Transactions" t
                            INNER JOIN "Wallets" tw ON tw."Id" = t."WalletId"
                   WHERE t."Type" = 1
                     AND EXTRACT(MONTH FROM t."Date") = EXTRACT(MONTH FROM CURRENT_DATE)
                     AND EXTRACT(YEAR FROM t."Date") = EXTRACT(YEAR FROM CURRENT_DATE)
                     AND tw."FamilyId" = @FamilyId) AS "TotalIncomed",

                  -- 3. Total Projected Expenditure
                  (SELECT COALESCE(SUM(e."Amount"), 0)
                   FROM "Expenses" e
                            INNER JOIN "Members" m ON m."Id" = e."MemberId"
                   WHERE m."FamilyId" = @FamilyId
                     AND (
                           (e."Type" = 1 AND EXTRACT(MONTH FROM e."Date") = EXTRACT(MONTH FROM CURRENT_DATE)
                                         AND EXTRACT(YEAR FROM e."Date") = EXTRACT(YEAR FROM CURRENT_DATE))
                           OR
                           (e."Type" = 2 AND e."Status" = true
                                         AND e."StartDate" <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
                                         AND (e."EndDate" IS NULL OR e."EndDate" >= DATE_TRUNC('month', CURRENT_DATE)))
                         )) AS "TotalProjectedExpenditure",

                  -- 4. Total Projected Income
                  (SELECT COALESCE(SUM(i."Amount"), 0)
                   FROM "Incomes" i
                            INNER JOIN "Members" m ON m."Id" = i."MemberId"
                   WHERE m."FamilyId" = @FamilyId
                     AND (
                           (i."Type" = 1 AND EXTRACT(MONTH FROM i."Date") = EXTRACT(MONTH FROM CURRENT_DATE)
                                         AND EXTRACT(YEAR FROM i."Date") = EXTRACT(YEAR FROM CURRENT_DATE))
                           OR
                           (i."Type" = 2 AND i."Status" = true
                                         AND i."StartDate" <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
                                         AND (i."EndDate" IS NULL OR i."EndDate" >= DATE_TRUNC('month', CURRENT_DATE)))
                         )) AS "TotalProjectedIncome",

                  -- 5. Total Balance
                  (SELECT COALESCE(SUM(w."CashBalance"), 0) + COALESCE(SUM(bc."DebitBalance"), 0)
                   FROM "Wallets" w
                            LEFT JOIN "BankAccounts" bc ON bc."WalletId" = w."Id"
                   WHERE w."FamilyId" = @FamilyId) AS "TotalBalance",

                  -- 6. Total Credit Limit
                  (SELECT COALESCE(SUM(b."CreditLimit"), 0) + COALESCE(SUM(c."TotalLimit"), 0)
                   FROM "BankAccounts" b
                            LEFT JOIN "Wallets" w ON b."WalletId" = w."Id"
                            LEFT JOIN "CreditCards" c ON c."BankAccountId" = b."Id"
                   WHERE w."FamilyId" = @FamilyId) AS "TotalCreditLimit",

                  -- 7. Total Credit Expensed
                  (SELECT COALESCE(SUM(b."CreditLimit"), 0) + COALESCE(SUM(c."TotalLimit"), 0) - COALESCE(SUM(c."RemainingLimit"), 0)
                  FROM "BankAccounts" b
                           LEFT JOIN "Wallets" w ON b."WalletId" = w."Id"
                           LEFT JOIN "CreditCards" c ON c."BankAccountId" = b."Id"
                  WHERE w."FamilyId" = @FamilyId) AS "TotalCreditExpensed"
                  ;

                  -- 8. Projected Income by Category
                  SELECT c."Name" AS "CategoryName", COALESCE(SUM(i."Amount"), 0) AS "TotalAmount"
                  FROM "Incomes" i
                  INNER JOIN "Categories" c ON c."Id" = i."CategoryId"
                  INNER JOIN "Members" m ON m."Id" = i."MemberId"
                  WHERE m."FamilyId" = @FamilyId
                    AND (
                          (i."Type" = 1 AND EXTRACT(MONTH FROM i."Date") = EXTRACT(MONTH FROM CURRENT_DATE)
                                        AND EXTRACT(YEAR FROM i."Date") = EXTRACT(YEAR FROM CURRENT_DATE))
                          OR
                          (i."Type" = 2 AND i."Status" = true
                                        AND i."StartDate" <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
                                        AND (i."EndDate" IS NULL OR i."EndDate" >= DATE_TRUNC('month', CURRENT_DATE)))
                        )
                  GROUP BY c."Id", c."Name"
                  ;

                  -- 9. Projected Expense by Category
                  SELECT c."Name" AS "CategoryName", COALESCE(SUM(e."Amount"), 0) AS "TotalAmount"
                  FROM "Expenses" e
                  INNER JOIN "Categories" c ON c."Id" = e."CategoryId"
                  INNER JOIN "Members" m ON m."Id" = e."MemberId"
                  WHERE m."FamilyId" = @FamilyId
                    AND (
                          (e."Type" = 1 AND EXTRACT(MONTH FROM e."Date") = EXTRACT(MONTH FROM CURRENT_DATE)
                                        AND EXTRACT(YEAR FROM e."Date") = EXTRACT(YEAR FROM CURRENT_DATE))
                          OR
                          (e."Type" = 2 AND e."Status" = true
                                        AND e."StartDate" <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
                                        AND (e."EndDate" IS NULL OR e."EndDate" >= DATE_TRUNC('month', CURRENT_DATE)))
                        )
                  GROUP BY c."Id", c."Name"
                  ;
                  """;
        var sqlResult = new SqlQuery(sql, familyId);
        return sqlResult;
    }
}