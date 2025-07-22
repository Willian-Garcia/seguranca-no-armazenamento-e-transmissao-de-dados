import validator from 'validator';

export function sanitizeInput(input: string): string {
  return validator.escape(input);
}
