namespace Application.Shared.Auth;

public interface IPasswordHasher
{
    bool Verify(string plainTextPassword, string passwordHash);
}
