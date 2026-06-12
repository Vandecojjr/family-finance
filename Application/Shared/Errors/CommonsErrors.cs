using Application.Shared.Results;

namespace Application.Shared.Errors;

public static class CommonsErrors
{
    public static Error MemberNotFound => Error.NotFound("User.MemberNotFound", "Usuário logado não encontrado.");
    public static Error FamilyAccessDenied => Error.NotFound("Family.AccessDenied", "Usu?rio logado n?o encontrado.");
}