/**
 * Validates a CPF algorithmically.
 * @param cpf The CPF string (formatted or unformatted)
 * @returns boolean
 */
export const validateCpf = (cpf: string): boolean => {
    if (!cpf) return false;

    // Remove non-digits
    const cleanCpf = cpf.replace(/[^\d]/g, '');

    if (cleanCpf.length !== 11) return false;

    // Reject all same digits (e.g. 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    let sum = 0;
    let remainder;

    // Validate 1st digit
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false;

    sum = 0;
    // Validate 2nd digit
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false;

    return true;
};

/**
 * Applies a mask to a CPF string (000.000.000-00).
 * @param value Raw or partially formatted string
 * @returns Formatted string
 */
export const maskCpf = (value: string): string => {
    return value
        .replace(/\D/g, '') // Remove all non-digits
        .replace(/(\d{3})(\d)/, '$1.$2') // Add first dot
        .replace(/(\d{3})(\d)/, '$1.$2') // Add second dot
        .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Add dash
        .replace(/(-\d{2})\d+?$/, '$1'); // Limit to 11 digits
};
