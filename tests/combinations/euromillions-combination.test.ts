import { describe, expect, it, vi } from 'vitest';

import {
    EUROMILLIONS_STAR_COMBINATIONS,
    EUROMILLIONS_WINNING_RANKS,
    EuroMillionsCombination,
    getCombinationRank
} from 'src/combinations/index.ts';

const toRandomForInt = (target: number, min: number, max: number): number => {
    const span = max - min + 1;
    return (target - min + 0.5) / span;
};

describe('EuroMillionsCombination', () => {
    it('starts empty and exposes constants', () => {
        const empty = new EuroMillionsCombination();
        expect(empty.numbers.values).toEqual([]);
        expect(empty.stars.values).toEqual([]);
        expect(empty.nbWinningRanks).toBe(Object.keys(EUROMILLIONS_WINNING_RANKS).length);
        expect(empty.minWinningRank).toBe(1);
        expect(empty.maxWinningRank).toBe(13);
    });

    it('constructs from a variety of value inputs', () => {
        let comb = new EuroMillionsCombination({ numbers: [3, 2, 1] });
        expect(comb.numbers.values).toEqual([1, 2, 3]);
        expect(comb.stars.values).toEqual([]);
        expect(comb.rank).toBe(getCombinationRank([1, 2, 3], 1));

        comb = new EuroMillionsCombination({ numbers: [3, 2, 1], stars: [3] });
        expect(comb.numbers.values).toEqual([1, 2, 3]);
        expect(comb.stars.values).toEqual([3]);
        expect(comb.rank).toBe(
            getCombinationRank([1, 2, 3], 1) * EUROMILLIONS_STAR_COMBINATIONS + getCombinationRank([3], 1)
        );

        comb = new EuroMillionsCombination({ stars: [3] });
        expect(comb.numbers.values).toEqual([]);
        expect(comb.stars.values).toEqual([3]);
        expect(comb.rank).toBe(getCombinationRank([3], 1));

        // flattened payload
        comb = new EuroMillionsCombination({ numbers: [3, 5, 2, 4, 1, 6, 7, 8] });
        expect(comb.numbers.values).toEqual([1, 2, 3, 4, 5]);
        expect(comb.stars.values).toEqual([6, 7]);
        expect(comb.rank).toBe(
            getCombinationRank([1, 2, 3, 4, 5], 1) * EUROMILLIONS_STAR_COMBINATIONS + getCombinationRank([6, 7], 1)
        );
    });

    it('allows constructing from another instance (copy semantics)', () => {
        const original = new EuroMillionsCombination({ numbers: [1, 2, 3, 4, 5], stars: [6, 7] });
        const copy = new EuroMillionsCombination({ numbers: original });
        expect(copy.numbers.values).toEqual(original.numbers.values);
        expect(copy.stars.values).toEqual(original.stars.values);
        expect(copy.rank).toBe(original.rank);

        const replaced = new EuroMillionsCombination({ numbers: original, stars: [8, 9] });
        expect(replaced.stars.values).toEqual([8, 9]);
        expect(replaced.rank).toBe(
            original.numbers.rank * EUROMILLIONS_STAR_COMBINATIONS + getCombinationRank([8, 9], 1)
        );
    });

    it('accepts rank inputs and component-rank objects', () => {
        const numberRank = getCombinationRank([1, 2, 3, 4, 5], 1);
        const starRank = getCombinationRank([6, 7], 1);
        const totalRank = numberRank * EUROMILLIONS_STAR_COMBINATIONS + starRank;

        const comb = new EuroMillionsCombination({ numbers: numberRank, stars: starRank });
        expect(comb.rank).toBe(totalRank);

        const comb2 = new EuroMillionsCombination({
            numbers: { values: [5, 1, 4, 2, 3], rank: numberRank },
            stars: { values: [9, 2], rank: starRank }
        });

        expect(comb2.numbers.rank).toBe(numberRank);
        expect(comb2.stars.rank).toBe(starRank);
        expect(comb2.rank).toBe(totalRank);
    });

    it('generate() supports various counts/partitions without throwing', () => {
        const combination = new EuroMillionsCombination();
        expect(() => combination.generate()).not.toThrow();
        expect(combination.generate({ n: 2 })).toHaveLength(2);
        expect(combination.generate({ n: 3, partitions: 3 })).toHaveLength(3);
        expect(combination.generate({ n: 4, partitions: 2 })).toHaveLength(4);
    });

    it('generate() returns deterministic combinations when random is seeded', () => {
        const combination = new EuroMillionsCombination();
        const partition1 = combination.combinations;
        const partition2 = Math.ceil(partition1 / 2);
        const partition3 = Math.ceil(partition1 / 3);

        // Mirrors Python 0.2.0 deterministic test seed sequence.
        const ranks = [
            29885207, 6713773, 73827621, 16434414, 61592139, 102589671, 13756669, 81587812, 56629388, 74184879
        ];

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

    it('copy/getCombination retains subclass type and allows overrides', () => {
        const base = new EuroMillionsCombination({ numbers: [1, 2, 3, 4, 5], stars: [6, 7] });
        const copy = base.copy();
        expect(copy).toBeInstanceOf(EuroMillionsCombination);
        expect(copy).not.toBe(base);

        const copyNum = base.copy({ components: { numbers: [4, 8, 15, 16, 23] } });
        expect(copyNum).toBeInstanceOf(EuroMillionsCombination);
        expect(copyNum.numbers.values).not.toEqual(base.numbers.values);
        expect(copyNum.numbers.values).toEqual([4, 8, 15, 16, 23]);

        const copyStars = base.copy({ components: { stars: [5, 8] } });
        expect(copyStars).toBeInstanceOf(EuroMillionsCombination);
        expect(copyStars.stars.values).toEqual([5, 8]);

        const built = base.getCombination({ combination: [2, 3, 4, 5, 6, 7, 8] });
        expect(built).toBeInstanceOf(EuroMillionsCombination);

        const built2 = base.getCombination({ components: { stars: [2, 3] } });
        expect(built2).toBeInstanceOf(EuroMillionsCombination);
    });

    it('getWinningRank works via several call modes and matches mapping', () => {
        const combination = new EuroMillionsCombination({ numbers: [1, 2, 3, 4, 5], stars: [6, 7] });

        const keyList = Object.keys(EUROMILLIONS_WINNING_RANKS) as Array<string>;
        for (const key of keyList) {
            const [m, s] = key.split(',').map(Number);
            const expected = EUROMILLIONS_WINNING_RANKS[key];
            // pick values that share exactly `m` numbers and `s` stars with the
            // winning combination
            const numbers = [1, 2, 3, 4, 5].slice(0, m);
            const stars = [6, 7].slice(0, s);

            expect(combination.getWinningRank({ components: { numbers, stars } })).toBe(expected);
            expect(combination.getWinningRank({ combination: null, components: { numbers, stars } })).toBe(expected);

            const combinationValues = numbers.concat(stars);
            // Only validate the flat-combination input when it includes all required values.
            if (m === 5 && s === 2) {
                expect(combination.getWinningRank({ combination: combinationValues })).toBe(expected);
            }
        }

        expect(() => combination.getWinningRank({ components: { extra: [1] as unknown as number[] } })).toThrow(
            'Component "extra" does not exist in the combination.'
        );
    });

    it('support equality, includes, intersects, intersection, compares and similarity', () => {
        const c1 = new EuroMillionsCombination({ numbers: [1, 2, 3, 4, 5], stars: [1, 2] });
        const c2 = new EuroMillionsCombination({ numbers: [5, 4, 3, 2, 1], stars: [2, 1] });
        const c3 = new EuroMillionsCombination({ numbers: [1, 2, 4, 5, 7], stars: [3, 4] });

        expect(c1.equals(c2)).toBe(true);
        expect(c1.equals(c3)).toBe(false);
        expect(c1.includes({ components: { numbers: [2] } })).toBe(true);
        expect(c1.includes({ components: { stars: [3] } })).toBe(false);
        expect(c1.intersects({ components: { numbers: [3] } })).toBe(true);
        expect(c1.intersection({ components: { numbers: [1, 3, 5, 6, 7], stars: [1, 3] } })).toBeInstanceOf(
            EuroMillionsCombination
        );
        expect(c1.compares({ components: { numbers: [1, 3, 5, 6, 7], stars: [1, 3] } })).toBe(-1);
        expect(c1.similarity({ components: { numbers: [1, 3, 5, 6, 7], stars: [1, 3] } })).toBe(4 / 7);
    });

    it('iteration, indexing and string/hash output behave as expected', () => {
        const comb = new EuroMillionsCombination({ numbers: [5, 3, 1, 4, 2], stars: [4, 2] });
        expect([...comb]).toEqual([1, 2, 3, 4, 5, 2, 4]);
        expect(comb.values[0]).toBe(1);
        expect(comb.length).toBe(7);
        expect(comb.toString().startsWith('numbers')).toBe(true);
        expect(comb.toRepr()).toBe('EuroMillionsCombination(numbers=[1,2,3,4,5], stars=[2,4])');
        expect(comb.hashCode()).toBe(comb.rank);
    });
});
