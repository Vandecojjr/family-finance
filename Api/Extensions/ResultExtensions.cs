using System.Linq;
using Application.Shared.Results;
using Microsoft.AspNetCore.Http;
using static Application.Shared.Results.ErrorType;

namespace Api.Extensions;

public static class ResultExtensions
{
    public static Microsoft.AspNetCore.Http.IResult ToResult(this Result result)
    {
        return result.IsSuccess
            ? Results.Ok(result)
            : CreateProblemResult(result.Errors);
    }

    public static Microsoft.AspNetCore.Http.IResult ToResult<T>(this Result<T> result)
    {
        return result.IsSuccess
            ? Results.Ok(result)
            : CreateProblemResult(result.Errors);
    }

    private static Microsoft.AspNetCore.Http.IResult CreateProblemResult(IReadOnlyList<Error> errors)
    {
        if (!errors.Any())
        {
            return Results.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Ocorreu um erro inesperado.");
        }

        if (errors.Count == 1)
        {
            var firstError = errors[0];
            return Results.Problem(
                statusCode: MapErrorTypeToStatusCode(firstError.Type),
                title: firstError.Code,
                detail: firstError.Description);
        }

        return Results.ValidationProblem(
            errors: errors
                .GroupBy(e => e.Code)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.Description).ToArray()),
            title: "Ocorreu um ou mais erros de validação.",
            statusCode: StatusCodes.Status400BadRequest
        );
    }

    private static int MapErrorTypeToStatusCode(ErrorType type) =>
        type switch
        {
            Failure => StatusCodes.Status400BadRequest,
            Validation => StatusCodes.Status400BadRequest,
            NotFound => StatusCodes.Status404NotFound,
            Conflict => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };
}
