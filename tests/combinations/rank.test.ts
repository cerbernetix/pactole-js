import { describe, expect, it, vi } from 'vitest';

import { comb, generate, getCombinationFromRank, getCombinationRank } from 'src/combinations/index.ts';

const toRandomForInt = (target: number, min: number, max: number): number => {
    const span = max - min + 1;
    return (target - min + 0.5) / span;
};

describe('comb', () => {
    it('returns expected binomial values', () => {
        expect(comb(5, 2)).toBe(10);
        expect(comb(5, 2)).toBe(10); // Test caching by calling the same inputs again
        expect(comb(10, 3)).toBe(120);
        expect(comb(10, 0)).toBe(1);
        expect(comb(10, 10)).toBe(1);
        expect(comb(4, 8)).toBe(0);
        expect(comb(50, 5)).toBe(2118760);
        expect(comb(40, 6)).toBe(3838380);
        expect(comb(12, 2)).toBe(66);
    });

    it('throws for invalid inputs', () => {
        expect(() => comb(-1, 2)).toThrow(RangeError);
        expect(() => comb(2, -1)).toThrow(RangeError);
        expect(() => comb(3.5, 1)).toThrow(RangeError);
    });
});

describe('getCombinationRank', () => {
    it('returns expected ranks for known combinations', () => {
        expect(getCombinationRank([])).toBe(0);
        expect(getCombinationRank([0])).toBe(0);
        expect(getCombinationRank([1])).toBe(1);
        expect(getCombinationRank([0, 1, 2])).toBe(0);
        expect(getCombinationRank([0, 2, 3])).toBe(2);
        expect(getCombinationRank([1, 2, 3], 1)).toBe(0);
        expect(getCombinationRank([23, 33, 45])).toBe(14741);
    });

    it('returns expected ranks for known combinations with offset', () => {
        expect(getCombinationRank([], 1)).toBe(0);
        expect(getCombinationRank([1], 1)).toBe(0);
        expect(getCombinationRank([2], 1)).toBe(1);
        expect(getCombinationRank([1, 2, 3], 1)).toBe(0);
        expect(getCombinationRank([11, 12], 1)).toBe(65);
        expect(getCombinationRank([24, 34, 46], 1)).toBe(14741);
        expect(getCombinationRank([46, 47, 48, 49, 50], 1)).toEqual(2118759);
        expect(getCombinationRank([35, 36, 37, 38, 39, 40], 1)).toEqual(3838379);
    });

    it('normalizes values by sorting before ranking', () => {
        expect(getCombinationRank([6, 1, 3], 1)).toBe(getCombinationRank([1, 3, 6], 1));
    });
});

describe('getCombinationFromRank', () => {
    it('returns expected combinations for known ranks', () => {
        expect(getCombinationFromRank(0, 0)).toEqual([]);
        expect(getCombinationFromRank(0, 1)).toEqual([0]);
        expect(getCombinationFromRank(1, 1)).toEqual([1]);
        expect(getCombinationFromRank(65, 2)).toEqual([10, 11]);
        expect(getCombinationFromRank(0, 3)).toEqual([0, 1, 2]);
        expect(getCombinationFromRank(2, 3)).toEqual([0, 2, 3]);
        expect(getCombinationFromRank(14741, 3)).toEqual([23, 33, 45]);
    });

    it('returns expected combinations for known ranks with offset', () => {
        expect(getCombinationFromRank(0, 1, 1)).toEqual([1]);
        expect(getCombinationFromRank(1, 1, 1)).toEqual([2]);
        expect(getCombinationFromRank(7, 1, 2)).toEqual([9]);
        expect(getCombinationFromRank(65, 2, 1)).toEqual([11, 12]);
        expect(getCombinationFromRank(0, 3, 1)).toEqual([1, 2, 3]);
        expect(getCombinationFromRank(2, 3, 1)).toEqual([1, 3, 4]);
        expect(getCombinationFromRank(14741, 3, 1)).toEqual([24, 34, 46]);
        expect(getCombinationFromRank(2118759, 5, 1)).toEqual([46, 47, 48, 49, 50]);
        expect(getCombinationFromRank(3838379, 6, 1)).toEqual([35, 36, 37, 38, 39, 40]);
    });

    it('throws for invalid arguments', () => {
        expect(() => getCombinationFromRank(-1, 3)).toThrow(RangeError);
        expect(() => getCombinationFromRank(1, -1)).toThrow(RangeError);
    });

    it('round-trips with getCombinationRank for sample ranks', () => {
        const samples = [0, 1, 2, 7, 19, 42, 123];

        for (const rank of samples) {
            const values = getCombinationFromRank(rank, 5, 1);
            const computed = getCombinationRank(values, 1);
            expect(computed).toBe(rank);
        }
    });
});

describe('generate', () => {
    it('generates combination ranks with partitioned rank windows', () => {
        const combinations = 3838380; // comb(40, 6)
        const partition1 = combinations;
        const partition2 = Math.ceil(combinations / 2);
        const partition3 = Math.ceil(combinations / 3);

        const ranks = [12, 34, 56, 7, partition3 + 8, partition3 * 2 + 9, 10, partition2 + 11, 12, partition2 + 13];

        const randomValues = [
            toRandomForInt(ranks[0], 0, partition1 - 1),
            toRandomForInt(ranks[1], 0, partition1 - 1),
            toRandomForInt(ranks[2], 0, partition1 - 1),
            toRandomForInt(ranks[3], partition3 * 0, partition3 * 1 - 1),
            toRandomForInt(ranks[4], partition3 * 1, partition3 * 2 - 1),
            toRandomForInt(ranks[5], partition3 * 2, partition3 * 3 - 1),
            toRandomForInt(ranks[6], partition2 * 0, partition2 * 1 - 1),
            toRandomForInt(ranks[7], partition2 * 1, partition2 * 2 - 1),
            toRandomForInt(ranks[8], partition2 * 0, partition2 * 1 - 1),
            toRandomForInt(ranks[9], partition2 * 1, partition2 * 2 - 1)
        ];

        using spy = vi.spyOn(Math, 'random').mockImplementation(() => randomValues.shift() ?? 0);

        const generated1 = Array.from(generate(combinations, 0, 0));
        expect(generated1).toHaveLength(1);
        expect(generated1[0]).toEqual(ranks[0]);

        const generated2 = Array.from(generate(combinations, 2));
        expect(generated2).toHaveLength(2);
        expect(generated2[0]).toEqual(ranks[1]);
        expect(generated2[1]).toEqual(ranks[2]);

        const generated3 = Array.from(generate(combinations, 3, 3));
        expect(generated3).toHaveLength(3);
        expect(generated3[0]).toEqual(ranks[3]);
        expect(generated3[1]).toEqual(ranks[4]);
        expect(generated3[2]).toEqual(ranks[5]);

        const generated4 = Array.from(generate(combinations, 4, 2));
        expect(generated4).toHaveLength(4);
        expect(generated4[0]).toEqual(ranks[6]);
        expect(generated4[1]).toEqual(ranks[7]);
        expect(generated4[2]).toEqual(ranks[8]);
        expect(generated4[3]).toEqual(ranks[9]);

        expect(spy).toHaveBeenCalledTimes(10);
    });
});
