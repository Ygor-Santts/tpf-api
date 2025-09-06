import { Transform } from 'class-transformer';

export function ToNumberArray() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map((v) => Number(v));
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
        .map((v) => Number(v));
    }

    const parsed = Number(value);
    return isNaN(parsed) ? [] : [parsed];
  });
}
