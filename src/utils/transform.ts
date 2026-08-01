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

/**
 * Normalize a query param into a trimmed string[] for `populations`.
 * Accepts repeated params (?populations=a&populations=b) or a single
 * comma-separated value (?populations=a,b). Always returns an array so the
 * downstream `@IsEnum(..., { each: true })` validation runs consistently.
 */
export const ToStringArrayQuery = () => {
  return Transform(({ value }) => {
    if (value == null) return [];
    if (Array.isArray(value)) return value.map(v => String(v).trim());
    if (typeof value === 'string') {
      return value
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
    }
    return [];
  });
};
