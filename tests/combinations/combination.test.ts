import { describe, expect, it } from 'vitest';

import { Combination, getCombinationRank, type CombinationInputWithRank } from 'src/combinations/index.ts';

describe('Combination', () => {
    it('builds an empty combination', () => {
        const combination = new Combination();

        expect(combination.length).toBe(0);
        expect(combination.values).toEqual([]);
        expect(combination.storedRank).toBeNull();
        expect(combination.rank).toBe(0);
        expect(combination.storedRank).toBe(0);
        expect(combination.start).toBe(1);
        expect([...combination]).toEqual([]);
    });

    it('builds from values with default and explicit start', () => {
        const defaultStart = new Combination([3, 2, 1]);
        expect(defaultStart.values).toEqual([1, 2, 3]);
        expect(defaultStart.storedRank).toBeNull();
        expect(defaultStart.rank).toBe(getCombinationRank([1, 2, 3], 1));
        expect(defaultStart.storedRank).toBe(getCombinationRank([1, 2, 3], 1));
        expect(defaultStart.length).toBe(3);
        expect(defaultStart.start).toBe(1);

        const customStart = new Combination([3, 2, 1], { start: 0 });
        expect(customStart.values).toEqual([1, 2, 3]);
        expect(customStart.storedRank).toBeNull();
        expect(customStart.rank).toBe(getCombinationRank([1, 2, 3], 0));
        expect(customStart.storedRank).toBe(getCombinationRank([1, 2, 3], 0));
        expect(customStart.length).toBe(3);
        expect(customStart.start).toBe(0);
    });

    it('supports options-object constructor and copy paths', () => {
        const base = new Combination([3, 2, 1], { start: 0 });
        expect(base.values).toEqual([1, 2, 3]);
        expect(base.start).toBe(0);

        const shifted = base.copy({ start: 2 });
        expect(shifted.values).toEqual([3, 4, 5]);
        expect(shifted.start).toBe(2);

        const ranked = base.copy({ rank: 9 });
        expect(ranked.rank).toBe(9);
        expect(ranked.values).toEqual(base.values);
    });

    it('builds from another combination and keeps rank/start parity', () => {
        const original = new Combination([4, 5, 6]);
        const clone = new Combination(original);

        expect(clone.values).toEqual(original.values);
        expect(clone.rank).toBe(original.rank);
        expect(clone.storedRank).toBe(original.storedRank);
        expect(clone.length).toBe(original.length);
        expect(clone.start).toBe(original.start);

        const shifted = new Combination(original, { start: 2 });
        expect(shifted.values).toEqual([5, 6, 7]);
        expect(shifted.storedRank).toBe(getCombinationRank([5, 6, 7], 2));
        expect(shifted.rank).toBe(getCombinationRank([5, 6, 7], 2));
        expect(shifted.length).toBe(original.length);
        expect(shifted.start).toBe(2);
    });

    it('supports input with rank and explicit rank override', () => {
        const input: CombinationInputWithRank = { values: [4, 5, 6], rank: 123 };
        const combination = new Combination(input);

        expect(combination.values).toEqual([4, 5, 6]);
        expect(combination.storedRank).toBe(123);
        expect(combination.rank).toBe(123);
        expect(combination.rank).not.toBe(getCombinationRank([4, 5, 6], 1));
        expect(combination.length).toBe(3);
        expect(combination.start).toBe(1);

        const explicitRank = new Combination([4, 5, 6], { rank: 456 });
        expect(explicitRank.rank).toBe(456);

        const overriddenObjectRank = new Combination({ values: [4, 5, 6], rank: 123 }, { rank: 999 });
        expect(overriddenObjectRank.rank).toBe(999);
    });

    it('handles undefined start when constructing from combination input', () => {
        const original = new Combination([4, 5, 6], { start: 1 });
        const withUndefinedStart = new Combination(original, { start: undefined as unknown as number | null });

        expect(withUndefinedStart.values).toEqual([4, 5, 6]);
        expect(withUndefinedStart.start).toBe(1);
        expect(withUndefinedStart.rank).toBe(getCombinationRank([4, 5, 6], 1));

        const fromObjectWithoutRank = new Combination({ values: [7, 8, 9] });
        expect(fromObjectWithoutRank.values).toEqual([7, 8, 9]);
        expect(fromObjectWithoutRank.rank).toBe(getCombinationRank([7, 8, 9], 1));

        const fromCombinationWithRankOverride = new Combination(original, { rank: 111 });
        expect(fromCombinationWithRankOverride.values).toEqual([4, 5, 6]);
        expect(fromCombinationWithRankOverride.rank).toBe(111);
    });

    it('copies combinations with optional overrides', () => {
        const combination = new Combination([3, 5, 7], { start: 1 });

        const same = combination.copy();
        expect(same).not.toBe(combination);
        expect(same.values).toEqual([3, 5, 7]);
        expect(same.start).toBe(1);
        expect(same.length).toBe(3);
        expect(same.rank).toBe(getCombinationRank([3, 5, 7], 1));

        const shifted = combination.copy({ start: 0 });
        expect(shifted.values).toEqual([2, 4, 6]);
        expect(shifted.start).toBe(0);
        expect(shifted.rank).toBe(getCombinationRank([2, 4, 6], 0));

        const changedValues = combination.copy({ values: [8, 10, 12] });
        expect(changedValues.values).toEqual([8, 10, 12]);
        expect(changedValues.start).toBe(1);
        expect(changedValues.rank).toBe(getCombinationRank([8, 10, 12], 1));

        const ranked = new Combination([2, 4, 6], { rank: 123, start: 1 });
        const rankedCopy = ranked.copy();
        expect(rankedCopy.values).toEqual([2, 4, 6]);
        expect(rankedCopy.rank).toBe(123);

        const fromRank = combination.copy({ values: getCombinationRank([2, 4, 6], 1) });
        expect(fromRank.values).toEqual([2, 4, 6]);
        expect(fromRank.rank).toBe(getCombinationRank([2, 4, 6], 1));
        expect(fromRank.start).toBe(1);
    });

    it('returns values for different starts', () => {
        const combination = new Combination([3, 1, 2]);

        expect(combination.getValues()).toEqual([1, 2, 3]);
        expect(combination.getValues(0)).toEqual([0, 1, 2]);
        expect(combination.getValues(1)).toEqual([1, 2, 3]);
        expect(combination.getValues(2)).toEqual([2, 3, 4]);
    });

    it('supports equals with arrays, combinations and ranks', () => {
        const combination1 = new Combination([1, 2, 3]);
        const combination2 = new Combination([3, 2, 1]);
        const combination3 = new Combination([1, 2, 4]);
        const combination4 = new Combination([1, 2, 3], { start: 0 });
        const rank = getCombinationRank([1, 2, 3], 1);

        expect(combination1.equals([1, 2, 3])).toBe(true);
        expect(combination2.equals([1, 2, 3])).toBe(true);
        expect(combination3.equals([1, 2, 4])).toBe(true);
        expect(combination4.equals([1, 2, 3])).toBe(true);
        expect(combination1.equals([1, 2, 4])).toBe(false);

        expect(combination1.equals(combination2)).toBe(true);
        expect(combination1.equals(combination3)).toBe(false);
        expect(combination1.equals(combination4)).toBe(false);

        expect(combination1.equals(rank)).toBe(true);
        expect(combination1.equals(rank + 1)).toBe(false);

        expect(combination1.equals([])).toBe(false);
        expect(combination1.equals(null)).toBe(false);
    });

    it('supports includes for scalar, arrays and combinations', () => {
        const combination1 = new Combination([2, 4, 6]);
        const combination2 = new Combination([2, 4]);
        const combination3 = new Combination([2, 5]);
        const combination4 = new Combination([2, 4], { start: 0 });
        const combination5 = new Combination([1, 3], { start: 0 });
        const combination6 = new Combination([1, 3]);

        expect(combination1.includes([])).toBe(true);
        expect(combination1.includes([2])).toBe(true);
        expect(combination1.includes([2, 4])).toBe(true);
        expect(combination1.includes(4)).toBe(true);
        expect(combination1.includes([2, 5])).toBe(false);
        expect(combination1.includes([5])).toBe(false);
        expect(combination1.includes(5)).toBe(false);

        expect(combination1.includes(combination2)).toBe(true);
        expect(combination1.includes(combination3)).toBe(false);
        expect(combination1.includes(combination4)).toBe(false);
        expect(combination1.includes(combination5)).toBe(true);
        expect(combination1.includes(combination6)).toBe(false);

        expect(combination1.includes(null)).toBe(true);
    });

    it('supports intersects and intersection', () => {
        const combination1 = new Combination([1, 2, 3]);
        const combination2 = new Combination([3, 4, 5]);
        const combination3 = new Combination([4, 5, 6]);
        const combination4 = new Combination([0, 1, 2], { start: 0 });

        expect(combination1.intersects([3])).toBe(true);
        expect(combination1.intersects([3, 4])).toBe(true);
        expect(combination1.intersects([3, 4, 5])).toBe(true);
        expect(combination1.intersects([4, 5, 6])).toBe(false);
        expect(combination1.intersects([4])).toBe(false);
        expect(combination1.intersects([])).toBe(false);
        expect(combination1.intersects(null)).toBe(false);

        expect(combination1.intersects(combination2)).toBe(true);
        expect(combination1.intersects(combination3)).toBe(false);
        expect(combination1.intersects(combination4)).toBe(true);

        expect(combination1.intersection([3, 4, 5]).values).toEqual([3]);
        expect(combination1.intersection([4, 5, 6]).values).toEqual([]);
        expect(combination1.intersection([]).values).toEqual([]);
        expect(combination1.intersection(null).values).toEqual([]);
        expect(combination1.intersection(combination2).values).toEqual([3]);
        expect(combination1.intersection(combination3).values).toEqual([]);
        expect(combination1.intersection(combination4).values).toEqual([1, 2, 3]);
    });

    it('supports compares and similarity', () => {
        const combination1 = new Combination([1, 2, 3]);
        const combination2 = new Combination([1, 2, 4]);
        const combination3 = new Combination([0, 1, 2], { start: 0 });
        const rank1 = getCombinationRank([1, 2, 3], 1);
        const rank2 = getCombinationRank([1, 2, 4], 1);

        expect(combination1.compares(null)).toBe(-1);
        expect(combination1.compares([])).toBe(-1);
        expect(combination1.compares([1, 2, 4])).toBe(-1);
        expect(combination2.compares([1, 2, 3])).toBe(1);
        expect(combination1.compares([1, 2, 3])).toBe(0);

        expect(combination1.compares(combination2)).toBe(-1);
        expect(combination2.compares(combination1)).toBe(1);
        expect(combination1.compares(combination1)).toBe(0);
        expect(combination1.compares(combination3)).toBe(0);

        expect(combination1.compares(rank2)).toBe(-1);
        expect(combination2.compares(rank1)).toBe(1);
        expect(combination1.compares(rank1)).toBe(0);

        const similarityA = new Combination([1, 2, 3]);
        const similarityB = new Combination([2, 3, 4]);
        const similarityC = new Combination([4, 5, 6]);
        const similarityD = new Combination([0, 1, 2], { start: 0 });

        expect(new Combination(null).similarity(null)).toBe(1);
        expect(new Combination([]).similarity([])).toBe(1);
        expect(new Combination([]).similarity([1, 2, 3])).toBe(0);
        expect(new Combination(null).similarity([1, 2, 3])).toBe(0);

        expect(similarityA.similarity([1, 2, 3])).toBe(1);
        expect(similarityA.similarity([2, 3, 4])).toBe(2 / 3);
        expect(similarityA.similarity([4, 5, 6])).toBe(0);
        expect(similarityA.similarity([])).toBe(0);
        expect(similarityA.similarity(null)).toBe(0);

        expect(similarityA.similarity(similarityA)).toBe(1);
        expect(similarityA.similarity(similarityB)).toBe(2 / 3);
        expect(similarityA.similarity(similarityC)).toBe(0);
        expect(similarityA.similarity(similarityD)).toBe(1);
    });

    it('supports iteration, index access, string/debug and hash code', () => {
        const combination = new Combination([3, 1, 2]);

        expect([...combination]).toEqual([1, 2, 3]);
        expect(combination.get(0)).toBe(1);
        expect(combination.get(1)).toBe(2);
        expect(combination.get(2)).toBe(3);
        expect(() => combination.get(3)).toThrow(RangeError);

        expect(combination.toString()).toBe('[1,2,3]');

        const reprA = new Combination([3, 1, 2], { start: 0 });
        expect(reprA.toRepr()).toBe('Combination(values=[1,2,3], rank=None, start=0)');

        const reprB = new Combination([3, 1, 2], { rank: 123, start: 0 });
        expect(reprB.toRepr()).toBe('Combination(values=[1,2,3], rank=123, start=0)');

        const combination1 = new Combination([1, 2, 3]);
        const combination2 = new Combination([3, 2, 1]);
        const combination3 = new Combination([1, 2, 4]);

        expect(combination1.hashCode()).toBe(combination2.hashCode());
        expect(combination1.hashCode()).not.toBe(combination3.hashCode());
        expect(combination1.hashCode()).toBe(combination1.rank);
    });
});
