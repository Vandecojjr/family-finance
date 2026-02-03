using Application.Shared.Auth;
using Application.Shared.Results;
using Mediator;

namespace Application.Shared.Authorization;

public class AuthorizationBehavior<TRequest, TResponse>(ICurrentUser currentUser) 
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IMessage
{
    public async ValueTask<TResponse> Handle(TRequest message, MessageHandlerDelegate<TRequest, TResponse> next, CancellationToken cancellationToken)
    {
        if (message is IAuthorizeableRequest authorizeableRequest)
        {
            if (!currentUser.IsAuthenticated)
            {
                // Return unauthorized result if possible, or throw
                throw new UnauthorizedAccessException("Usuário não autenticado.");
            }

            foreach (var permission in authorizeableRequest.RequiredPermissions)
            {
                if (!currentUser.HasPermission(permission))
                {
                    throw new UnauthorizedAccessException($"Usuário não tem a permissão necessária: {permission}");
                }
            }
        }

        return await next(message, cancellationToken);
    }
}
