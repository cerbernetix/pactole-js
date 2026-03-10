import { describe, expect, it } from 'vitest';

import {
    EUROMILLIONS_STAR_COMBINATIONS,
    EUROMILLIONS_WINNING_RANKS,
    EuroMillionsCombination,
    getCombinationRank
} from 'src/combinations/index.ts';

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
        }
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
