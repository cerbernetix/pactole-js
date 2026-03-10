import { describe, expect, it, vi } from 'vitest';

import {
    BoundCombination,
    Combination,
    getCombinationFromRank,
    getCombinationRank,
    type CombinationInputWithRank
} from 'src/combinations/index.ts';

const toRandomForInt = (target: number, min: number, max: number): number => {
    const span = max - min + 1;
    return (target - min + 0.5) / span;
};

describe('BoundCombination', () => {
    it('builds an empty combination with default bounds', () => {
        const combination = new BoundCombination();

        expect(combination.length).toBe(0);
        expect(combination.values).toEqual([]);
        expect(combination.rank).toBe(0);
        expect(combination.start).toBe(1);
        expect(combination.end).toBe(50);
        expect(combination.count).toBe(5);
        expect(combination.combinations).toBe(2118760);
    });

    it('builds from values and computes combinations when omitted', () => {
        const explicit = new BoundCombination([3, 2, 1], { start: 1, end: 50, count: 5, combinations: 2118760 });

        expect(explicit.values).toEqual([1, 2, 3]);
        expect(explicit.rank).toBe(getCombinationRank([1, 2, 3], 1));
        expect(explicit.length).toBe(3);
        expect(explicit.start).toBe(1);
        expect(explicit.end).toBe(50);
        expect(explicit.count).toBe(5);
        expect(explicit.combinations).toBe(2118760);

        const computed = new BoundCombination([1, 2, 3, 4, 5, 6, 7], { start: 1, end: 50, count: 5 });

        expect(computed.values).toEqual([1, 2, 3, 4, 5]);
        expect(computed.rank).toBe(getCombinationRank([1, 2, 3, 4, 5], 1));
        expect(computed.combinations).toBe(2118760);
    });

    it('supports options-object constructor and copy overrides', () => {
        const base = new BoundCombination([3, 2, 1], { start: 1, end: 10, count: 3 });
        expect(base.values).toEqual([1, 2, 3]);
        expect(base.start).toBe(1);
        expect(base.end).toBe(10);
        expect(base.count).toBe(3);

        const shifted = base.copy({ start: 0, end: 9 });
        expect(shifted.values).toEqual([0, 1, 2]);
        expect(shifted.start).toBe(0);
        expect(shifted.end).toBe(9);

        const fromRank = base.copy({ values: 4 });
        expect(fromRank.rank).toBe(4);
        expect(fromRank.count).toBe(3);
    });

    it('builds from rank and from rank without values', () => {
        const rank = 1000;
        const fromRank = new BoundCombination(rank, { start: 1, end: 50, count: 5 });

        expect(fromRank.values).toEqual(getCombinationFromRank(rank, 5, 1));
        expect(fromRank.rank).toBe(rank);
        expect(fromRank.length).toBe(5);
        expect(fromRank.start).toBe(1);
        expect(fromRank.end).toBe(50);
        expect(fromRank.count).toBe(5);
        expect(fromRank.combinations).toBe(2118760);

        const fromOptionalRank = new BoundCombination(null, { rank: 42, start: 1, end: 10, count: 3 });

        expect(fromOptionalRank.values).toEqual(getCombinationFromRank(42, 3, 1));
        expect(fromOptionalRank.rank).toBe(42);
        expect(fromOptionalRank.length).toBe(3);
        expect(fromOptionalRank.start).toBe(1);
        expect(fromOptionalRank.end).toBe(10);
        expect(fromOptionalRank.count).toBe(3);
        expect(fromOptionalRank.combinations).toBe(120);
    });

    it('builds from combinations and input-with-rank', () => {
        const original = new BoundCombination([10, 20, 30], { start: 1, end: 50, count: 5 });
        const sameStart = new BoundCombination(original, { start: 1, end: 50, count: 5 });

        expect(sameStart.values).toEqual(original.values);
        expect(sameStart.rank).toBe(original.rank);
        expect(sameStart.length).toBe(original.length);
        expect(sameStart.start).toBe(1);
        expect(sameStart.end).toBe(50);
        expect(sameStart.count).toBe(5);
        expect(sameStart.combinations).toBe(2118760);

        const shifted = new BoundCombination(original, { start: 0, end: 49, count: 5 });

        expect(shifted.values).toEqual([9, 19, 29]);
        expect(shifted.rank).toBe(getCombinationRank([9, 19, 29], 0));
        expect(shifted.start).toBe(0);
        expect(shifted.end).toBe(49);

        const rankedCombination = new Combination([1, 2, 3], { rank: 321, start: 1 });
        const fromRankedCombination = new BoundCombination(rankedCombination, { start: 1, end: 10, count: 3 });

        expect(fromRankedCombination.values).toEqual([1, 2, 3]);
        expect(fromRankedCombination.rank).toBe(321);

        const input: CombinationInputWithRank = { values: [4, 5, 6], rank: 123 };
        const withRankInput = new BoundCombination(input, { start: 1, end: 50, count: 5 });

        expect(withRankInput.values).toEqual([4, 5, 6]);
        expect(withRankInput.rank).toBe(123);
        expect(withRankInput.rank).not.toBe(getCombinationRank([4, 5, 6], 1));

        const withoutRankInInput: CombinationInputWithRank = { values: [7, 8, 9] };
        const withUndefinedRank = new BoundCombination(withoutRankInInput, { start: 1, end: 50, count: 5 });
        expect(withUndefinedRank.rank).toBe(getCombinationRank([7, 8, 9], 1));
    });

    it('clamps values to bounds and truncates to count', () => {
        const combination = new BoundCombination([99, 2, 3, 4], { start: 1, end: 10, count: 3 });

        expect(combination.values).toEqual([2, 3, 10]);
        expect(combination.count).toBe(3);
    });

    it('generates combinations with partitioned rank windows', () => {
        const combination = new BoundCombination(null, { start: 1, end: 10, count: 5 });
        const partition1 = combination.combinations;
        const partition2 = Math.ceil(combination.combinations / 2);
        const partition3 = Math.ceil(combination.combinations / 3);

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

        const generated1 = combination.generate({ n: 0, partitions: 0 });
        expect(generated1).toHaveLength(1);
        expect(generated1[0]?.values).toEqual(getCombinationFromRank(ranks[0], 5, 1));

        const generated2 = combination.generate({ n: 2 });
        expect(generated2).toHaveLength(2);
        expect(generated2[0]?.values).toEqual(getCombinationFromRank(ranks[1], 5, 1));
        expect(generated2[1]?.values).toEqual(getCombinationFromRank(ranks[2], 5, 1));

        const generated3 = combination.generate({ n: 3, partitions: 3 });
        expect(generated3).toHaveLength(3);
        expect(generated3[0]?.values).toEqual(getCombinationFromRank(ranks[3], 5, 1));
        expect(generated3[1]?.values).toEqual(getCombinationFromRank(ranks[4], 5, 1));
        expect(generated3[2]?.values).toEqual(getCombinationFromRank(ranks[5], 5, 1));

        const generated4 = combination.generate({ n: 4, partitions: 2 });
        expect(generated4).toHaveLength(4);
        expect(generated4[0]?.values).toEqual(getCombinationFromRank(ranks[6], 5, 1));
        expect(generated4[1]?.values).toEqual(getCombinationFromRank(ranks[7], 5, 1));
        expect(generated4[2]?.values).toEqual(getCombinationFromRank(ranks[8], 5, 1));
        expect(generated4[3]?.values).toEqual(getCombinationFromRank(ranks[9], 5, 1));

        expect(spy).toHaveBeenCalledTimes(10);
    });

    it('copies combinations with optional bound overrides', () => {
        const combination = new BoundCombination([2, 3, 4, 5, 7], { start: 1, end: 50, count: 5 });

        const withRankValue = combination.copy({ values: 15 });
        expect(withRankValue).toBeInstanceOf(BoundCombination);
        expect(withRankValue).not.toBe(combination);
        expect(withRankValue.values).toEqual([1, 2, 5, 6, 7]);
        expect(withRankValue.start).toBe(1);
        expect(withRankValue.end).toBe(50);
        expect(withRankValue.count).toBe(5);
        expect(withRankValue.combinations).toBe(2118760);

        const shifted = combination.copy({ start: 0, end: 49 });
        expect(shifted.values).toEqual([1, 2, 3, 4, 6]);
        expect(shifted.start).toBe(0);
        expect(shifted.end).toBe(49);
        expect(shifted.count).toBe(5);
        expect(shifted.combinations).toBe(2118760);

        const recounted = combination.copy({ count: 3 });
        expect(recounted.values).toEqual([2, 3, 4]);
        expect(recounted.start).toBe(1);
        expect(recounted.end).toBe(50);
        expect(recounted.count).toBe(3);
        expect(recounted.combinations).toBe(19600);

        const explicit = combination.copy({ combinations: 999 });
        expect(explicit.combinations).toBe(999);
    });

    it('inherits comparison helpers and overridden string representations', () => {
        const combination1 = new BoundCombination([1, 2, 3], { start: 1, end: 10, count: 3 });
        const combination2 = new BoundCombination([3, 2, 1], { start: 1, end: 10, count: 3 });
        const combination3 = new BoundCombination([1, 2, 4], { start: 1, end: 10, count: 3 });
        const combination4 = new BoundCombination([1, 2, 3], { start: 0, end: 9, count: 3 });

        expect(combination1.equals(combination2)).toBe(true);
        expect(combination1.equals(combination3)).toBe(false);
        expect(combination1.equals(combination4)).toBe(false);
        expect(combination1.includes(combination2)).toBe(true);
        expect(combination1.intersects(combination3)).toBe(true);
        expect(combination1.intersection(combination3).values).toEqual([1, 2]);

        expect(combination1.toString()).toBe('[ 1,  2,  3]');
        expect(new BoundCombination([3, 6, 12, 33, 42], { start: 1, end: 50, count: 5 }).toString()).toBe(
            '[ 3,  6, 12, 33, 42]'
        );
        expect(new BoundCombination([3, 6, 12], { start: 1, end: 50, count: 5 }).toString()).toBe(
            '[         3,  6, 12]'
        );

        expect(new BoundCombination([3, 1, 2], { start: 1, end: 10, count: 3 }).toRepr()).toBe(
            'BoundCombination(values=[1,2,3], rank=None, start=1, end=10, count=3, combinations=120)'
        );
        expect(new BoundCombination([3, 1, 2], { rank: 123, start: 1, end: 10, count: 3 }).toRepr()).toBe(
            'BoundCombination(values=[1,2,3], rank=123, start=1, end=10, count=3, combinations=120)'
        );
    });

    it('preserves explicit rank precedence across constructor and copy branches', () => {
        const fromInputWithRankAndOverride = new BoundCombination(
            { values: [4, 5, 6], rank: 123 },
            { rank: 999, start: 1, end: 10, count: 3 }
        );
        expect(fromInputWithRankAndOverride.rank).toBe(999);

        const sourceCombination = new Combination([1, 2, 3], { rank: 321, start: 1 });
        const fromCombinationWithOverride = new BoundCombination(sourceCombination, {
            rank: 777,
            start: 1,
            end: 10,
            count: 3
        });
        expect(fromCombinationWithOverride.rank).toBe(777);

        const fromRankNumberWithOverride = new BoundCombination(42, { rank: 888, start: 1, end: 10, count: 3 });
        expect(fromRankNumberWithOverride.rank).toBe(888);
        expect(fromRankNumberWithOverride.values).toEqual(getCombinationFromRank(42, 3, 1));

        const unranked = new BoundCombination([2, 4, 6], { start: 1, end: 10, count: 3 });
        const copiedWithRank = unranked.copy({ rank: 654 });
        expect(copiedWithRank.rank).toBe(654);
        expect(copiedWithRank.values).toEqual(unranked.values);

        const ranked = new BoundCombination([2, 4, 6], { start: 1, end: 10, count: 3 });
        expect(ranked.rank).toBe(getCombinationRank([2, 4, 6], 1));
        const copiedFromRanked = ranked.copy({ rank: 111 });
        expect(copiedFromRanked.rank).toBe(ranked.rank);
    });
});
