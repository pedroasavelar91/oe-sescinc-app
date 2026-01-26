/**
 * Formata um CPF para o padrão xxx.xxx.xxx-xx
 * @param cpf - CPF com ou sem formatação
 * @returns CPF formatado
 */
export const formatCPF = (cpf: string): string => {
    // Remove tudo que não é dígito
    const numbers = cpf.replace(/\D/g, '');

    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);

    // Aplica a máscara xxx.xxx.xxx-xx
    if (limited.length <= 3) {
        return limited;
    } else if (limited.length <= 6) {
        return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    } else if (limited.length <= 9) {
        return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    } else {
        return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
    }
};

/**
 * Remove a formatação do CPF, retornando apenas os números
 * @param cpf - CPF formatado
 * @returns CPF sem formatação (apenas números)
 */
export const unformatCPF = (cpf: string): string => {
    return cpf.replace(/\D/g, '');
};

/**
 * Valida se um CPF é válido
 * @param cpf - CPF com ou sem formatação
 * @returns true se o CPF é válido
 */
export const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');

    if (numbers.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(numbers)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(9))) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(10))) return false;

    return true;
};

/**
 * Formata um telefone para o padrão (xx) x xxxx-xxxx
 * @param phone - Telefone com ou sem formatação
 * @returns Telefone formatado
 */
export const formatPhone = (phone: string): string => {
    const numbers = phone.replace(/\D/g, '');
    const limited = numbers.slice(0, 11);

    if (limited.length <= 2) {
        return limited;
    } else if (limited.length <= 3) {
        return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else if (limited.length <= 7) {
        return `(${limited.slice(0, 2)}) ${limited.slice(2, 3)} ${limited.slice(3)}`;
    } else {
        return `(${limited.slice(0, 2)}) ${limited.slice(2, 3)} ${limited.slice(3, 7)}-${limited.slice(7)}`;
    }
};
