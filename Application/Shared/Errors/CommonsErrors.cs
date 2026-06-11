using Application.Shared.Results;

namespace Application.Shared.Errors;

public static class CommonsErrors
{
    public static Error MemberNotFound => Error.NotFound("User.MemberNotFound", "Usu?rio logado n?o encontrado.");
}