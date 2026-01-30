using FluentValidation;
using System.Text.RegularExpressions;

namespace Application.Shared.Validation;

public static partial class FluentValidationExtensions
{
    public static IRuleBuilderOptions<T, string> MustBeCpf<T>(this IRuleBuilder<T, string> ruleBuilder)
    {
        return ruleBuilder.Must(IsCpfValid).WithMessage("O CPF informado é inválido.");
    }

    private static bool IsCpfValid(string cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf)) return false;

        // Remove non-digits
        cpf = Regex.Replace(cpf, @"[^\d]", "");

        if (cpf.Length != 11) return false;

        // Check for common invalid CPFs (all same digits)
        if (new string(cpf[0], 11) == cpf) return false;

        var tempCpf = cpf[..9];
        var sum = 0;

        // First digit
        for (var i = 0; i < 9; i++)
            sum += int.Parse(tempCpf[i].ToString()) * (10 - i);

        var remainder = sum % 11;
        var digit1 = remainder < 2 ? 0 : 11 - remainder;

        tempCpf += digit1;
        sum = 0;

        // Second digit
        for (var i = 0; i < 10; i++)
            sum += int.Parse(tempCpf[i].ToString()) * (11 - i);

        remainder = sum % 11;
        var digit2 = remainder < 2 ? 0 : 11 - remainder;

        return cpf.EndsWith(digit1.ToString() + digit2.ToString());
    }
}
