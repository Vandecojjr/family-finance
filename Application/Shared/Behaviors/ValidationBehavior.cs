using Application.Shared.Results;
using FluentValidation;
using Mediator;

namespace Application.Shared.Behaviors;

public sealed class ValidationBehavior<TMessage, TResponse>(IEnumerable<IValidator<TMessage>> validators)
    : IPipelineBehavior<TMessage, TResponse>
    where TMessage : class, IMessage
    where TResponse : IResult
{
    private readonly IEnumerable<IValidator<TMessage>> _validators = validators;

    public async ValueTask<TResponse> Handle(
        TMessage message,
        MessageHandlerDelegate<TMessage, TResponse> next,
        CancellationToken cancellationToken)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TMessage>(message);
            
            var validationResults = await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, cancellationToken)));
                
            var failures = validationResults
                .SelectMany(r => r.Errors)
                .Where(f => f is not null)
                .ToArray();

            if (failures.Length > 0)
            {
                var errors = failures
                    .Select(f => Error.Validation(f.ErrorCode ?? f.PropertyName, f.ErrorMessage))
                    .ToArray();

                return ResultFactory.Failure<TResponse>(errors);
            }
        }

        return await next(message, cancellationToken);
    }
}
