export function validateAndFilter<T>(
  options: T,
  validKeys: Array<keyof T>,
  requiredKeys: Array<keyof T>,
): Partial<T> {
  const filteredOptions: Partial<T> = {};
  for (const key in options) {
    if (validKeys.includes(key as keyof T)) {
      filteredOptions[key as keyof T] = options[key];
    }
  }

  for (const key of requiredKeys) {
    if (!(key in filteredOptions)) {
      throw new Error(`Missing required field: ${String(key)}`);
    }
  }

  return filteredOptions;
}
