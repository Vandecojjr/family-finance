UPDATE "Transactions"
SET "MemberId" = w."MemberId"
FROM "WalletAccounts" a
JOIN "Wallets" w ON a."WalletId" = w."Id"
WHERE "Transactions"."AccountId" = a."Id"
AND "Transactions"."MemberId" = '00000000-0000-0000-0000-000000000000';
