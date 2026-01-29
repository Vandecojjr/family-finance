namespace Application.Shared.Auth;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string plainTextPassword, string passwordHash);
}
