import { ValidationError } from './errors.ts';

/**
 * Assert a runtime condition and raise a validation error when it fails.
 *
 * @param condition - Condition that must be truthy.
 * @param message - Validation message for the thrown error.
 * @throws ValidationError When the condition is falsy.
 */
export function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new ValidationError(message);
    }
}

/**
 * Assert that a runtime value is a string.
 *
 * @param value - Value to validate.
 * @param name - Input name used in the error message.
 * @throws ValidationError When the value is not a string.
 */
export function assertString(value: unknown, name = 'value'): asserts value is string {
    if (typeof value !== 'string') {
        throw new ValidationError(`${name} must be a string`);
    }
}

/**
 * Assert that a runtime value is a finite number.
 *
 * @param value - Value to validate.
 * @param name - Input name used in the error message.
 * @throws ValidationError When the value is not a finite number.
 */
export function assertFiniteNumber(value: unknown, name = 'value'): asserts value is number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new ValidationError(`${name} must be a finite number`);
    }
}
