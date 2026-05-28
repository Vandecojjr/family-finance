using System.Text;
using Domain.Enums.Queries;

namespace Infrastructure.Queries.Expanses;

public static class AccountsPayableSql
{
    public static SqlQuery GetAllByMember(Guid memberId, Date onlyDate)
    {
        var sb = new StringBuilder();
        sb.Append("""
                   SELECT  
                       re."Description",
                       re."Amount",
                       re."Frequency",
                       c."Name" as CategoryName
                   FROM "RecurringExpensePayments" p
                   INNER JOIN "RecurringExpenses" re on p."RecurringExpenseId" = re."Id"
                   INNER JOIN "Categories" c on re."CategoryId" = c."Id"
                   WHERE re."MemberId" = {0}
                   """);

        var dateLogic = GetDateLogic(onlyDate);
        if (!string.IsNullOrEmpty(dateLogic))
        {
            sb.AppendLine();
            sb.Append(dateLogic);
        }
        
        return new SqlQuery(sb.ToString(), memberId);
    }

    private static string GetDateLogic(Date onlyDate)
    {
        return onlyDate switch
        {
            Date.Week => "AND EXTRACT(WEEK FROM p.\"PaidAt\") <> EXTRACT(WEEK FROM CURRENT_DATE)",
            Date.Month => "AND EXTRACT(MONTH FROM p.\"PaidAt\") <> EXTRACT(MONTH FROM CURRENT_DATE)",
            Date.Year => "AND EXTRACT(YEAR FROM p.\"PaidAt\") <> EXTRACT(YEAR FROM CURRENT_DATE)",
            _ => string.Empty
        };
    }
}