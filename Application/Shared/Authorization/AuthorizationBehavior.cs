using Application.Shared.Auth;
using Application.Shared.Results;
using Mediator;

namespace Application.Shared.Authorization;

public class AuthorizationBehavior<TRequest, TResponse>(ICurrentUser currentUser) 
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : class, IMessage
    where TResponse : IResult
{
    public async ValueTask<TResponse> Handle(TRequest message, MessageHandlerDelegate<TRequest, TResponse> next, CancellationToken cancellationToken)
    {
        if (message is IAuthorizeableRequest authorizeableRequest)
        {
            if (!currentUser.IsAuthenticated)
            {
                return ResultFactory.Failure<TResponse>([
                    Error.Forbidden("Auth.Unauthenticated", "Usuário não autenticado.")
                ]);
            }

            foreach (var permission in authorizeableRequest.RequiredPermissions)
            {
                if (!currentUser.HasPermission(permission))
                {
                    return ResultFactory.Failure<TResponse>([
                        Error.Forbidden("Auth.Forbidden", $"Usuário não tem a permissão necessária: {permission}")
                    ]);
                }
            }
        }

        return await next(message, cancellationToken);
    }
}
