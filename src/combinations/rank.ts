import type { CombinationRank } from './types.ts';

const combCache = new Map<string, number>();

const getCacheKey = (n: number, k: number): string => `${n}:${k}`;

/**
 * Asserts that a value is a non-negative integer.
 *
 * @param value - Value to validate.
 * @param label - Parameter label used in error messages.
 * @throws {RangeError} Thrown when `value` is not an integer or is negative.
 */
const assertNonNegativeInteger = (value: number, label: string): void => {
    if (!Number.isInteger(value) || value < 0) {
        throw new RangeError(`${label} must be a non-negative integer, got ${value}.`);
    }
};

/**
 * Cached computation of the binomial coefficient (`n` choose `k`).
 *
 * @param n - The total number of items.
 * @param k - The number of items to choose.
 * @returns The number of combinations (`n` choose `k`).
 * @throws {RangeError} Thrown when `n` or `k` is negative or not an integer.
 *
 * @example
 * `comb(5, 2) // 10`
 *
 * @example
 * `comb(10, 3) // 120`
 */
export const comb = (n: number, k: number): number => {
    assertNonNegativeInteger(n, 'n');
    assertNonNegativeInteger(k, 'k');

    if (k > n) {
        return 0;
    }

    const normalizedK = Math.min(k, n - k);
    if (normalizedK === 0) {
        return 1;
    }

    const cacheKey = getCacheKey(n, normalizedK);
    const cached = combCache.get(cacheKey);
    if (cached !== undefined) {
        return cached;
    }

    let result = 1;
    for (let index = 1; index <= normalizedK; index += 1) {
        result = Math.floor((result * (n - normalizedK + index)) / index);
    }

    combCache.set(cacheKey, result);
    return result;
};

/**
 * Get the lexicographic rank of a given combination.
 *
 * Values are sorted before computing rank, and `offset` is subtracted from
 * each value during ranking.
 *
 * @param combination - The combination to get the lexicographic rank for.
 * @param offset - An offset to apply to each value in the combination.
 * @returns The lexicographic rank of the combination.
 *
 * @example
 * `getCombinationRank([0, 1, 2]) // 0`
 *
 * @example
 * `getCombinationRank([0, 2, 3]) // 2`
 *
 * @example
 * `getCombinationRank([1, 2, 3], 1) // 0`
 */
export const getCombinationRank = (combination: Iterable<number>, offset = 0): CombinationRank => {
    const sorted = [...combination].sort((left, right) => left - right);

    let rank = 0;
    for (const [index, value] of sorted.entries()) {
        const shiftedValue = value - offset;

        if (shiftedValue === index) {
            continue;
        }

        rank += comb(shiftedValue, index + 1);
    }

    return rank;
};

/**
 * Get the combination corresponding to a given lexicographic rank.
 *
 * Values are returned sorted, and `offset` is added to each value in the resulting combination.
 *
 * @param rank - The lexicographic rank of the combination.
 * @param length - The length of the combination.
 * @param offset - An offset to apply to each value in the combination.
 * @returns The combination corresponding to the lexicographic rank.
 * @throws {RangeError} Thrown when `rank` or `length` is negative or not an integer.
 *
 * @example
 * `getCombinationFromRank(0, 3) // [0, 1, 2]`
 *
 * @example
 * `getCombinationFromRank(2, 3) // [0, 2, 3]`
 *
 * @example
 * `getCombinationFromRank(0, 3, 1) // [1, 2, 3]`
 */
export const getCombinationFromRank = (rank: CombinationRank, length = 2, offset = 0): number[] => {
    assertNonNegativeInteger(rank, 'rank');
    assertNonNegativeInteger(length, 'length');

    if (length === 0) {
        return [];
    }

    if (length === 1) {
        return [rank + offset];
    }

    const values = new Array<number>(length).fill(0);

    let binomial = 0;
    let maxValue = 0;
    let currentBinomial = 1;

    while (currentBinomial <= rank) {
        maxValue += 1;
        binomial = currentBinomial;
        currentBinomial = Math.floor((currentBinomial * (maxValue + length)) / maxValue);
    }

    let mutableRank = rank;
    for (let index = length - 1; index > 1; index -= 1) {
        mutableRank -= binomial;
        binomial = Math.floor((binomial * (index + 1)) / (maxValue + index));
        values[index] = maxValue + index + offset;

        while (binomial > mutableRank) {
            maxValue -= 1;
            binomial = Math.floor((binomial * maxValue) / (maxValue + index));
        }
    }

    values[1] = maxValue + 1 + offset;
    values[0] = mutableRank - binomial + offset;

    return values;
};
