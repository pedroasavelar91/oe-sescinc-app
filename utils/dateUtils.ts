
/**
 * Converte uma string de data (YYYY-MM-DD) ou timestamp UTC para uma data local correta.
 * Resolve o problema de datas voltando 1 dia devido ao fuso horário.
 */
export const getLocalDate = (dateInput: string | Date | null | undefined): Date => {
    if (!dateInput) return new Date();

    // Se já for Date, retorna
    if (dateInput instanceof Date) return dateInput;

    // Se for string YYYY-MM-DD (sem hora), cria no fuso local
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    // Se for timestamp completo (ISO), converte normalmente mas ajusta se necessário
    // Para este app, assumimos que datas vindas do banco sem hora devem ser tratadas como locais
    const date = new Date(dateInput);

    // Se a data original era apenas YYYY-MM-DD mas foi convertida para UTC meia-noite
    // e agora está voltando um dia no fuso local, ajustamos
    // Mas a abordagem do split acima é mais segura para inputs de data pura.

    return date;
};

/**
 * Formata uma data para o padrão brasileiro (DD/MM/YYYY)
 */
export const formatDate = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return '-';
    const date = getLocalDate(dateInput);
    return date.toLocaleDateString('pt-BR');
};

/**
 * Retorna a data atual no formato YYYY-MM-DD (fuso local)
 * Use esta função em vez de new Date().toISOString().split('T')[0]
 */
export const getCurrentDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Converte um objeto Date para string YYYY-MM-DD (fuso local)
 */
export const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Retorna o timestamp atual em formato ISO
 * Use esta função em vez de new Date().toISOString()
 */
export const getCurrentTimestamp = (): string => {
    return new Date().toISOString();
};
