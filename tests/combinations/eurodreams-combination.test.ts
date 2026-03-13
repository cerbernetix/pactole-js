import { describe, expect, it, vi } from 'vitest';

import {
    EURODREAMS_DREAM_COMBINATIONS,
    EURODREAMS_WINNING_RANKS,
    EuroDreamsCombination,
    getCombinationRank
} from 'src/combinations/index.ts';

const toRandomForInt = (target: number, min: number, max: number): number => {
    const span = max - min + 1;
    return (target - min + 0.5) / span;
};

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

    it('generate() returns deterministic combinations when random is seeded', () => {
        const combination = new EuroDreamsCombination();
        const partition1 = combination.combinations;
        const partition2 = Math.ceil(partition1 / 2);
        const partition3 = Math.ceil(partition1 / 3);

        const ranks = [3735650, 839221, 9228452, 2054301, 8269727, 13965128, 1719583, 18745682, 1458591, 16674623];

        const randomValues = [
            // generate() => partitions=1
            toRandomForInt(ranks[0], 0, partition1 - 1),
            // generate(2) => partitions=1
            toRandomForInt(ranks[1], 0, partition1 - 1),
            toRandomForInt(ranks[2], 0, partition1 - 1),
            // generate(3, partitions=3)
            toRandomForInt(ranks[3], partition3 * 0, partition3 * 1 - 1),
            toRandomForInt(ranks[4], partition3 * 1, partition3 * 2 - 1),
            toRandomForInt(ranks[5], partition3 * 2, partition3 * 3 - 1),
            // generate(4, partitions=2)
            toRandomForInt(ranks[6], partition2 * 0, partition2 * 1 - 1),
            toRandomForInt(ranks[7], partition2 * 1, partition2 * 2 - 1),
            toRandomForInt(ranks[8], partition2 * 0, partition2 * 1 - 1),
            toRandomForInt(ranks[9], partition2 * 1, partition2 * 2 - 1)
        ];

        const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => randomValues.shift() ?? 0);
        try {
            const generated1 = combination.generate();
            expect(generated1).toHaveLength(1);
            expect(generated1[0]?.rank).toBe(ranks[0]);

            const generated2 = combination.generate({ n: 2 });
            expect(generated2).toHaveLength(2);
            expect(generated2[0]?.rank).toBe(ranks[1]);
            expect(generated2[1]?.rank).toBe(ranks[2]);

            const generated3 = combination.generate({ n: 3, partitions: 3 });
            expect(generated3).toHaveLength(3);
            expect(generated3[0]?.rank).toBe(ranks[3]);
            expect(generated3[1]?.rank).toBe(ranks[4]);
            expect(generated3[2]?.rank).toBe(ranks[5]);

            const generated4 = combination.generate({ n: 4, partitions: 2 });
            expect(generated4).toHaveLength(4);
            expect(generated4[0]?.rank).toBe(ranks[6]);
            expect(generated4[1]?.rank).toBe(ranks[7]);
            expect(generated4[2]?.rank).toBe(ranks[8]);
            expect(generated4[3]?.rank).toBe(ranks[9]);
        } finally {
            randomSpy.mockRestore();
        }
    });

    it('winning rank mapping is honoured', () => {
        const base = new EuroDreamsCombination({ numbers: [1, 2, 3, 4, 5, 6], dream: [1] });
        for (const key of Object.keys(EURODREAMS_WINNING_RANKS)) {
            const [m, d] = key.split(',').map(Number);
            const expected = EURODREAMS_WINNING_RANKS[key];
            const numbers = [1, 2, 3, 4, 5, 6].slice(0, m);
            const dream = [1].slice(0, d);
            expect(base.getWinningRank({ components: { numbers, dream } })).toBe(expected);

            const combinationValues = numbers.concat(dream);
            expect(base.getWinningRank({ combination: combinationValues })).toBe(expected);
        }

        expect(() => base.getWinningRank({ components: { stars: [1] as unknown as number[] } })).toThrow(
            'Component "stars" does not exist in the combination.'
        );
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
