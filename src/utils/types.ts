/**
 * Convert a value to an integer when possible.
 *
 * Invalid or unsupported inputs return the provided default instead of
 * throwing, matching the forgiving coercion behavior expected by the utility
 * layer.
 *
 * @param value - Value to convert.
 * @param defaultValue - Fallback returned when conversion fails.
 * @returns The converted integer or the fallback value.
 *
 * @example
 * ```ts
 * getInt('42');
 * getInt('abc', 10);
 * ```
 */
export function getInt(value: unknown, defaultValue = 0): number {
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? Math.trunc(value) : defaultValue;
    }

    if (typeof value === 'string') {
        const normalized = value.trim();

        if (normalized.length === 0 || !/^[+-]?\d+$/.test(normalized)) {
            return defaultValue;
        }

        return Number.parseInt(normalized, 10);
    }

    return defaultValue;
}

/**
 * Convert a value to a float when possible.
 *
 * String inputs accept either `.` or `,` as the decimal separator. Invalid or
 * unsupported inputs return the provided default instead of throwing.
 *
 * @param value - Value to convert.
 * @param defaultValue - Fallback returned when conversion fails.
 * @returns The converted float or the fallback value.
 *
 * @example
 * ```ts
 * getFloat('3.14');
 * getFloat('3,14');
 * getFloat('abc', 1);
 * ```
 */
export function getFloat(value: unknown, defaultValue = 0): number {
    if (typeof value === 'string') {
        const normalized = value.replaceAll(',', '.').trim();
        const converted = Number(normalized);

        return Number.isFinite(converted) ? converted : defaultValue;
    }

    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : defaultValue;
    }

    return defaultValue;
}
