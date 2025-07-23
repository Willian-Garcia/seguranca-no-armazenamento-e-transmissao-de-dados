import validator from 'validator';

/**
 * Sanitiza strings para prevenir XSS.
 */
export function sanitizeInput(input: string): string {
  return validator.escape(input.trim());
}

/**
 * Formata número de telefone no padrão brasileiro:
 * Entrada: apenas dígitos (ex.: 11987654321)
 * Saída: +55 (11) 98765-4321
 */
export function formatPhoneNumber(input: string): string {
  // Remove qualquer caractere não numérico
  const digits = input.replace(/\D/g, '');

  // Se não tiver pelo menos 10 dígitos, retorna só os números
  if (digits.length < 10) return digits;

  // Caso com 11 dígitos (celular com 9 na frente)
  if (digits.length === 11) {
    const ddd = digits.substring(0, 2);
    const firstPart = digits.substring(2, 7);
    const secondPart = digits.substring(7);
    return `+55 (${ddd}) ${firstPart}-${secondPart}`;
  }

  // Caso com 10 dígitos (fixo)
  if (digits.length === 10) {
    const ddd = digits.substring(0, 2);
    const firstPart = digits.substring(2, 6);
    const secondPart = digits.substring(6);
    return `+55 (${ddd}) ${firstPart}-${secondPart}`;
  }

  // Se tiver mais que 11 dígitos, retorna apenas os dígitos (evita erro)
  return digits;
}
