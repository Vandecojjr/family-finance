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

    public ValueTask<TResponse> Handle(
        TMessage message,
        MessageHandlerDelegate<TMessage, TResponse> next,
        CancellationToken cancellationToken)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TMessage>(message);
            var failures = _validators
                .Select(v => v.Validate(context))
                .SelectMany(r => r.Errors)
                .Where(f => f is not null)
                .ToArray();

            if (failures.Length > 0)
            {
                var errors = failures
                    .Select(f => new Error(f.ErrorCode ?? f.PropertyName, f.ErrorMessage))
                    .ToArray();

                return new ValueTask<TResponse>(ResultFactory.Failure<TResponse>(errors));
            }
        }

        return next(message, cancellationToken);
    }
}
