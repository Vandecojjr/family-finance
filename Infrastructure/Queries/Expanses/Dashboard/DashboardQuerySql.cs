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
                   WHERE  m."FamilyId" = @FamilyId) AS "TotalProjectedExpenditure",

                  -- 4. Total Projected Income
                  (SELECT COALESCE(SUM(r."Amount"), 0) + COALESCE(SUM(p."Amount"), 0)
                   FROM "RecurringIncomes" r
                            INNER JOIN "Members" m ON m."Id" = r."MemberId"
                            LEFT JOIN "PlannedIncomes" p ON p."MemberId" = r."MemberId"
                   WHERE m."FamilyId" = @FamilyId) AS "TotalProjectedIncome",

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
                  (SELECT COALESCE(SUM(t."Amount"), 0)
                   FROM "Transactions" t
                            INNER JOIN "Wallets" tw ON tw."Id" = t."WalletId"
                   WHERE t."Type" = 2
                     AND t."UseCredit" IS NOT NULL OR t."CreditCardId" IS NOT NULL
                     AND EXTRACT(MONTH FROM t."Date") = EXTRACT(MONTH FROM CURRENT_DATE)
                     AND EXTRACT(YEAR FROM t."Date") = EXTRACT(YEAR FROM CURRENT_DATE)
                     AND tw."FamilyId" = @FamilyId) AS "TotalCreditExpensed";
                  """;
        var sqlResult = new SqlQuery(sql, familyId);
        return sqlResult;
    }
}