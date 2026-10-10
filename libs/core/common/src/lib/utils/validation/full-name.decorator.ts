import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Matches, MaxLength } from 'class-validator';

// First name and last name: at least two words of letters (apostrophes and
// hyphens allowed inside), the first and the last with 2+ letters, so
// "Ana de Souza" and "João D'Ávila" pass and "Ana" or "Ana S" do not.
// Same rule as the app's validation.
export const FULL_NAME =
  /^\p{L}[\p{L}'-]*\p{L}( \p{L}[\p{L}'-]*)* \p{L}[\p{L}'-]*\p{L}$/u;

// Trims and collapses repeated spaces, so " ana   souza " is stored as
// "ana souza".
export function squishName(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
}

export function IsFullName() {
  return applyDecorators(
    Transform(({ value }) => squishName(value)),
    MaxLength(80, { message: 'O nome pode ter no máximo 80 letras.' }),
    Matches(FULL_NAME, {
      message: 'Informe nome e sobrenome, só com letras. Ex.: Ana Souza.',
    }),
  );
}
