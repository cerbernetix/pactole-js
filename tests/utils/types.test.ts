import { describe, expect, it } from 'vitest';

import { getFloat, getInt } from 'src/utils/index.ts';

describe('getInt', () => {
    it.each([
        ['42', 42],
        [7, 7],
        [3.5, 3],
        [true, 1],
        [false, 0]
    ])('converts %s to %s', (value, expected) => {
        expect(getInt(value)).toBe(expected);
    });

    it.each([
        ['abc', 10],
        [null, 5],
        [{ value: 1 }, 2],
        ['3.14', 9],
        [Number.POSITIVE_INFINITY, 4]
    ])('returns the default for %o', (value, defaultValue) => {
        expect(getInt(value, defaultValue)).toBe(defaultValue);
    });
});

describe('getFloat', () => {
    it.each([
        ['3.14', 3.14],
        ['3,14', 3.14],
        [7, 7],
        [2.5, 2.5],
        [true, 1],
        [false, 0]
    ])('converts %s to %s', (value, expected) => {
        expect(getFloat(value)).toBe(expected);
    });

    it.each([
        ['abc', 1],
        [null, 2.5],
        [{ value: 1 }, 3],
        [Number.NaN, 6]
    ])('returns the default for %o', (value, defaultValue) => {
        expect(getFloat(value, defaultValue)).toBe(defaultValue);
    });
});
