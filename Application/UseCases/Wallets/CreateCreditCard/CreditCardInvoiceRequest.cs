namespace Application.UseCases.Wallets.CreateCreditCard;

public sealed record CreditCardInvoiceRequest(
    DateTime DueDate,
    decimal Amount);
