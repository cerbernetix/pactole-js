import { describe, expect, it } from 'vitest';

import {
    EURODREAMS_DREAM_COMBINATIONS,
    EURODREAMS_WINNING_RANKS,
    EuroDreamsCombination,
    getCombinationRank
} from 'src/combinations/index.ts';

describe('EuroDreamsCombination', () => {
    it('constructs empty and exposes winning-rank size', () => {
        const empty = new EuroDreamsCombination();
        expect(empty.numbers.values).toEqual([]);
        expect(empty.dream.values).toEqual([]);
        // the map stores one entry per tuple even when ranks repeat
        expect(Object.keys(EURODREAMS_WINNING_RANKS).length).toBeGreaterThan(0);
    });

    it('handles value inputs and flattened payload', () => {
        let comb = new EuroDreamsCombination({ numbers: [3, 2, 1, 4, 5, 6] });
        expect(comb.numbers.values).toEqual([1, 2, 3, 4, 5, 6]);
        expect(comb.dream.values).toEqual([]);

        comb = new EuroDreamsCombination({ numbers: [3, 2, 1, 4, 5, 6], dream: [2] });
        expect(comb.dream.values).toEqual([2]);

        comb = new EuroDreamsCombination({ dream: [4] });
        expect(comb.numbers.values).toEqual([]);
        expect(comb.dream.values).toEqual([4]);

        comb = new EuroDreamsCombination({ numbers: [1, 2, 3, 4, 5, 6, 3] });
        expect(comb.numbers.values).toEqual([1, 2, 3, 4, 5, 6]);
        expect(comb.dream.values).toEqual([3]);

        // flattened input where dream follows numbers
        comb = new EuroDreamsCombination({ numbers: [6, 5, 4, 3, 2, 1, 5] });
        expect(comb.numbers.values).toEqual([1, 2, 3, 4, 5, 6]);
        expect(comb.dream.values).toEqual([5]);
    });

    it('copies from existing instance with overrides', () => {
        const orig = new EuroDreamsCombination({ numbers: [1, 2, 3, 4, 5, 6], dream: [3] });
        const copy = new EuroDreamsCombination({ numbers: orig });
        expect(copy.numbers.values).toEqual(orig.numbers.values);
        expect(copy.rank).toBe(orig.rank);

        const changed = new EuroDreamsCombination({ numbers: orig, dream: [5] });
        expect(changed.dream.values).toEqual([5]);
    });

    it('accepts rank inputs', () => {
        const numRank = getCombinationRank([1, 2, 3, 4, 5, 6], 1);
        const dreamRank = getCombinationRank([3], 1);
        const total = numRank * EURODREAMS_DREAM_COMBINATIONS + dreamRank;
        const comb = new EuroDreamsCombination({ numbers: numRank, dream: dreamRank });
        expect(comb.rank).toBe(total);
    });

    it('generate partitions and retains subclass', () => {
        const combo = new EuroDreamsCombination();
        expect(() => combo.generate()).not.toThrow();
        expect(combo.generate({ n: 2 })).toHaveLength(2);
        expect(combo.generate({ n: 3, partitions: 3 })).toHaveLength(3);
    });

    it('winning rank mapping is honoured', () => {
        const base = new EuroDreamsCombination({ numbers: [1, 2, 3, 4, 5, 6], dream: [1] });
        for (const key of Object.keys(EURODREAMS_WINNING_RANKS)) {
            const [m, d] = key.split(',').map(Number);
            const expected = EURODREAMS_WINNING_RANKS[key];
            const numbers = [1, 2, 3, 4, 5, 6].slice(0, m);
            const dream = [1].slice(0, d);
            expect(base.getWinningRank({ components: { numbers, dream } })).toBe(expected);
        }
    });

    it('basic helper methods behave correctly', () => {
        const c1 = new EuroDreamsCombination({ numbers: [1, 2, 3, 4, 5, 6], dream: [1] });
        const c2 = new EuroDreamsCombination({ numbers: [6, 5, 4, 3, 2, 1], dream: [1] });
        expect(c1.equals(c2)).toBe(true);
        expect(c1.includes({ components: { numbers: [1, 2] } })).toBe(true);
        expect(c1.intersects({ components: { dream: [1] } })).toBe(true);
        expect(c1.compares({ components: { numbers: [6, 5, 4, 3, 2, 1], dream: [1] } })).toBe(0);
        expect(c1.similarity({ components: { numbers: [6, 5, 4, 3, 2, 1], dream: [1] } })).toBe(1);
    });

    it('toRepr returns explicit constructor-like string', () => {
        const comb = new EuroDreamsCombination({ numbers: [5, 3, 1, 4, 2, 6], dream: [4] });
        expect(comb.toRepr()).toBe('EuroDreamsCombination(numbers=[1,2,3,4,5,6], dream=[4])');
    });
});
