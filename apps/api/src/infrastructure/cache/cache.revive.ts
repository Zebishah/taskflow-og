/**
 * Upstash stores JSON; Date fields come back as ISO strings.
 * Revive them before service code calls getTime() / comparisons.
 */
export function reviveDate(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  return null;
}

export function reviveDatesInObject<T extends object>(
  value: T,
  keys: readonly (keyof T)[],
): T {
  const next = {
    ...value,
  };

  for (const key of keys) {
    Reflect.set(next, key, reviveDate(Reflect.get(value, key)));
  }

  return next;
}
