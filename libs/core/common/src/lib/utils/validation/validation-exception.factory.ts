import { BadRequestException, ValidationError } from '@nestjs/common';

// class-validator's default messages are in English and come as a list.
// The app needs one Portuguese message per field to show it under that field.
const MESSAGES: Record<string, (raw: string) => string> = {
  isEmail: () => 'Informe um e-mail válido.',
  minLength: (raw) => `Use pelo menos ${number(raw)} caracteres.`,
  maxLength: (raw) => `Use no máximo ${number(raw)} caracteres.`,
  arrayNotEmpty: () => 'Escolha pelo menos um item.',
};

const number = (raw: string) => raw.match(/\d+/)?.[0] ?? '';

function isEmpty(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '')
  );
}

function messageFor(error: ValidationError): string {
  if (isEmpty(error.value)) return 'Campo obrigatório.';
  const [key, raw] = Object.entries(error.constraints ?? {})[0] ?? [];
  if (!key) return 'Valor inválido.';
  // Messages we wrote ourselves (e.g. the phone rule) are already in Portuguese.
  return (
    MESSAGES[key]?.(raw) ??
    (raw.includes(error.property) ? 'Valor inválido.' : raw)
  );
}

function collect(
  errors: ValidationError[],
  parent = '',
  out: Record<string, string> = {},
) {
  for (const error of errors) {
    const field = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) out[field] = messageFor(error);
    if (error.children?.length) collect(error.children, field, out);
  }
  return out;
}

export function validationExceptionFactory(errors: ValidationError[]) {
  return new BadRequestException({
    statusCode: 400,
    message: 'Verifique os campos destacados.',
    errors: collect(errors),
  });
}
