import { Transform } from 'class-transformer';

export const ToArrayQuery = () => {
  return Transform(({ value }) => {
    if (value == null) return undefined;

    // ?k=a&k=b
    if (Array.isArray(value)) return value.map(String);

    // ?k=a
    if (typeof value === 'string') {
      const v = value.trim();
      return v ? [v] : undefined;
    }

    // fallback
    return [String(value)];
  });
};
