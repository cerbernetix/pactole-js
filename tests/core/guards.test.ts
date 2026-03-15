import { assert, assertFiniteNumber, assertString, ValidationError } from 'src/core/index.ts';
import { describe, expect, it } from 'vitest';

describe('core guards', () => {
    it('assert accepts truthy conditions', () => {
        expect(() => assert(true, 'expected truthy')).not.toThrow();
    });

    it('assert rejects falsy conditions', () => {
        expect(() => assert(false, 'expected truthy')).toThrow(ValidationError);
        expect(() => assert(false, 'expected truthy')).toThrow('expected truthy');
    });

    it('assertString validates strings', () => {
        expect(() => assertString('value', 'example')).not.toThrow();
        expect(() => assertString(123, 'example')).toThrow('example must be a string');
    });

    it('assertFiniteNumber validates finite numbers', () => {
        expect(() => assertFiniteNumber(1.5, 'duration')).not.toThrow();
        expect(() => assertFiniteNumber(Number.POSITIVE_INFINITY, 'duration')).toThrow(
            'duration must be a finite number'
        );
    });
});
