import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';

// Brazilian phone, national digits only: DDD + 8 digits (landline) or
// DDD + 9 + 8 digits (mobile). Same rule as the app's validation.
export const BR_PHONE = /^[1-9][0-9](9\d{8}|[2-5]\d{7})$/;

// Keeps only digits and drops a leading country code, so "(34) 99999-9999",
// "34999999999" and "+55 34 99999-9999" are stored the same way.
export function normalizeBrPhone(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  return digits.length > 11 && digits.startsWith('55')
    ? digits.slice(2)
    : digits;
}

export function IsBrPhone() {
  return applyDecorators(
    Transform(({ value }) => normalizeBrPhone(value)),
    Matches(BR_PHONE, {
      message: 'Telefone inválido. Ex.: (34) 99999-9999.',
    }),
  );
}
