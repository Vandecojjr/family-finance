using System.Collections.ObjectModel;

namespace Application.Shared.Results;

public sealed class Result : IResult
{
    public bool IsSuccess { get; }
    public IReadOnlyList<Error> Errors { get; }

    private Result(bool isSuccess, IEnumerable<Error>? errors)
    {
        IsSuccess = isSuccess;
        Errors = new ReadOnlyCollection<Error>((errors ?? Array.Empty<Error>()).ToList());
    }

    public static Result Success() => new(true, null);
    public static Result Failure(params Error[] errors) => new(false, errors);
    public static Result Failure(IEnumerable<Error> errors) => new(false, errors);
}

public sealed class Result<T> : IResult
{
    public bool IsSuccess { get; }
    public IReadOnlyList<Error> Errors { get; }
    public T? Value { get; }

    private Result(bool isSuccess, T? value, IEnumerable<Error>? errors)
    {
        IsSuccess = isSuccess;
        Value = value;
        Errors = new ReadOnlyCollection<Error>((errors ?? Array.Empty<Error>()).ToList());
    }

    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(params Error[] errors) => new(false, default, errors);
    public static Result<T> Failure(IEnumerable<Error> errors) => new(false, default, errors);
}

public static class ResultFactory
{
    public static TResponse Failure<TResponse>(IEnumerable<Error> errors)
        where TResponse : IResult
    {
        var t = typeof(TResponse);
        if (t == typeof(Result))
            return (TResponse)(object)Result.Failure(errors);

        if (t.IsGenericType && t.GetGenericTypeDefinition() == typeof(Result<>))
        {
            var method = typeof(ResultFactory)
                .GetMethod(nameof(FailureGeneric), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!
                .MakeGenericMethod(t.GetGenericArguments()[0]);

            return (TResponse)method.Invoke(null, new object[] { errors })!;
        }

        throw new InvalidOperationException($"Tipo de resultado não suportado: {t.FullName}");
    }

    private static Result<T> FailureGeneric<T>(IEnumerable<Error> errors) => Result<T>.Failure(errors);
}
