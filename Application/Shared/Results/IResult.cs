namespace Application.Shared.Results;

public interface IResult
{
    bool IsSuccess { get; }
    bool IsFailure => !IsSuccess;
    IReadOnlyList<Error> Errors { get; }
}
