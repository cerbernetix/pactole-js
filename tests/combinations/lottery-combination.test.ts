import { describe, expect, it, vi } from 'vitest';

import {
    BoundCombination,
    LotteryCombination,
    createWinningRanks,
    getCombinationFromRank,
    getCombinationRank
} from 'src/combinations/index.ts';

const NUMBER_COUNT = 5;
const NUMBER_START = 1;
const NUMBER_END = 50;
const NUMBER_COMBINATIONS = 2_118_760;

const EXTRA_COUNT = 3;
const EXTRA_START = 1;
const EXTRA_END = 20;
const EXTRA_COMBINATIONS = 1_140;

const WINNING_RANKS_NUMBERS = createWinningRanks([
    [[5], 1],
    [[4], 2],
    [[3], 3],
    [[2], 4]
]);

const WINNING_RANKS_EXTRA = createWinningRanks([
    [[5, 3], 1],
    [[5, 2], 2],
    [[5, 1], 3],
    [[5, 0], 4],
    [[4, 3], 5],
    [[4, 2], 6],
    [[4, 1], 7],
    [[4, 0], 8],
    [[3, 3], 9],
    [[3, 2], 10],
    [[3, 1], 11],
    [[3, 0], 12],
    [[2, 3], 13],
    [[2, 2], 14],
    [[2, 1], 15],
    [[2, 0], 16]
]);

const toRandomForInt = (target: number, min: number, max: number): number => {
    const span = max - min + 1;
    return (target - min + 0.5) / span;
};

const createNumbers = (values: number[] = [5, 4, 3, 2, 1]): BoundCombination =>
    new BoundCombination(values, {
        start: NUMBER_START,
        end: NUMBER_END,
        count: NUMBER_COUNT,
        combinations: NUMBER_COMBINATIONS
    });

const createExtra = (values: number[] = [10, 9, 8]): BoundCombination =>
    new BoundCombination(values, {
        start: EXTRA_START,
        end: EXTRA_END,
        count: EXTRA_COUNT,
        combinations: EXTRA_COMBINATIONS
    });

describe('LotteryCombination', () => {
    it('supports reserved component names and explicit winning-rank overrides', () => {
        const numbers = createNumbers();
        const extra = createExtra();

        const withReservedName = new LotteryCombination({
            components: {
                values: createNumbers(),
                extra: createExtra()
            }
        });
        expect(withReservedName.getComponent('values')).toBeInstanceOf(BoundCombination);
        expect(withReservedName.values).toEqual([1, 2, 3, 4, 5, 8, 9, 10]);

        const winningRanksOverride = new LotteryCombination({
            combination: new LotteryCombination({
                winningRanks: WINNING_RANKS_NUMBERS,
                components: { numbers }
            }),
            winningRanks: WINNING_RANKS_EXTRA,
            components: { extra }
        });
        expect(winningRanksOverride.winningRanks).toEqual(WINNING_RANKS_EXTRA);
    });

    it('supports rank and equality behavior with alternative component payloads', () => {
        const numbers = createNumbers();
        const extra = createExtra();
        const base = new LotteryCombination({ components: { numbers, extra } });

        const rankProbe = new LotteryCombination({ components: { numbers, extra } });
        (rankProbe as unknown as { _components: Record<string, unknown> })._components = {
            numbers,
            extra,
            ghost: undefined
        };
        expect(rankProbe.rank).toBe(
            getCombinationRank([1, 2, 3, 4, 5], 1) * EXTRA_COMBINATIONS + getCombinationRank([8, 9, 10], 1)
        );

        const equalityProbe = new LotteryCombination({ components: { numbers, extra } });
        const originalEqualityGetCombination = equalityProbe.getCombination.bind(equalityProbe);
        (equalityProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination = () =>
            ({
                length: equalityProbe.length,
                components: { numbers: undefined }
            }) as unknown as LotteryCombination;
        expect(equalityProbe.equals()).toBe(false);
        (equalityProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination =
            originalEqualityGetCombination;

        const sparseEqualityProbe = new LotteryCombination({ components: { numbers, extra } });
        const originalSparseEqualityGetCombination = sparseEqualityProbe.getCombination.bind(sparseEqualityProbe);
        const sparseEqualityComponents = { numbers };
        (sparseEqualityProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination =
            () =>
                ({
                    components: sparseEqualityComponents,
                    length: sparseEqualityProbe.length
                }) as unknown as LotteryCombination;

        const originalEntries = Object.entries;
        const sparseEqualitySpy = vi.spyOn(Object, 'entries').mockImplementation((value: object) => {
            if (value === sparseEqualityComponents) {
                return new Array(2) as [string, unknown][];
            }

            return originalEntries(value as Record<string, unknown>);
        });
        try {
            expect(sparseEqualityProbe.equals()).toBe(false);
        } finally {
            sparseEqualitySpy.mockRestore();
        }
        (sparseEqualityProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination =
            originalSparseEqualityGetCombination;

        const shorter = new LotteryCombination({ components: { numbers: numbers.copy({ values: [1, 2] }) } });
        expect(base.equals(shorter)).toBe(false);
    });

    it('supports includes and intersects with scalar and component payloads', () => {
        const numbers = createNumbers();
        const extra = createExtra();
        const base = new LotteryCombination({ components: { numbers, extra } });

        expect(() => base.includes({ combination: 1, components: { stars: [1] as unknown as number[] } })).toThrow(
            'Component "stars" does not exist'
        );
        expect(base.intersects({ combination: [] })).toBe(false);

        const includesProbe = new LotteryCombination({ components: { numbers, extra } });
        const originalIncludesGetCombination = includesProbe.getCombination.bind(includesProbe);
        (includesProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination = () =>
            ({
                components: { ghost: numbers },
                length: numbers.length
            }) as unknown as LotteryCombination;
        expect(includesProbe.includes()).toBe(false);
        (includesProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination =
            originalIncludesGetCombination;

        const intersectsProbe = new LotteryCombination({ components: { numbers, extra } });
        const originalIntersectsGetCombination = intersectsProbe.getCombination.bind(intersectsProbe);
        (intersectsProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination = () =>
            ({
                components: { ghost: numbers },
                length: numbers.length
            }) as unknown as LotteryCombination;
        expect(intersectsProbe.intersects()).toBe(false);
        (intersectsProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination =
            originalIntersectsGetCombination;
    });

    it('supports intersection and comparison behavior when components are missing', () => {
        const numbers = createNumbers();
        const extra = createExtra();

        const intersectionProbe = new LotteryCombination({ components: { numbers, extra } });
        const originalIntersectionGetCombination = intersectionProbe.getCombination.bind(intersectionProbe);
        (intersectionProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination =
            () =>
                ({
                    components: { ghost: numbers },
                    length: numbers.length
                }) as unknown as LotteryCombination;
        expect(() => intersectionProbe.intersection()).toThrow('Component "ghost" does not exist');
        (intersectionProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination =
            originalIntersectionGetCombination;

        const comparesProbe = new LotteryCombination({ components: { numbers, extra } });
        const originalComparesGetCombination = comparesProbe.getCombination.bind(comparesProbe);
        (comparesProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination = () =>
            ({
                components: { ghost: numbers },
                length: numbers.length
            }) as unknown as LotteryCombination;
        expect(() => comparesProbe.compares()).toThrow('Component "ghost" does not exist');
        (comparesProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination =
            originalComparesGetCombination;
    });

    it('supports similarity behavior for equivalent and invalid component sets', () => {
        const numbers = createNumbers();
        const extra = createExtra();

        const similarityWithUndefinedComponent = new LotteryCombination({ components: { numbers, extra } });
        const originalSimilarityWithUndefinedGetCombination = similarityWithUndefinedComponent.getCombination.bind(
            similarityWithUndefinedComponent
        );
        (
            similarityWithUndefinedComponent as unknown as { getCombination: LotteryCombination['getCombination'] }
        ).getCombination = () =>
            ({
                components: { numbers: undefined, extra },
                length: similarityWithUndefinedComponent.length
            }) as unknown as LotteryCombination;
        expect(similarityWithUndefinedComponent.similarity()).toBe(1);
        (
            similarityWithUndefinedComponent as unknown as { getCombination: LotteryCombination['getCombination'] }
        ).getCombination = originalSimilarityWithUndefinedGetCombination;

        const similarityWithUnknownComponent = new LotteryCombination({ components: { numbers, extra } });
        const originalSimilarityWithUnknownGetCombination =
            similarityWithUnknownComponent.getCombination.bind(similarityWithUnknownComponent);
        (
            similarityWithUnknownComponent as unknown as { getCombination: LotteryCombination['getCombination'] }
        ).getCombination = () =>
            ({
                components: { ghost: numbers },
                length: numbers.length
            }) as unknown as LotteryCombination;
        expect(() => similarityWithUnknownComponent.similarity()).toThrow('Component "ghost" does not exist');
        (
            similarityWithUnknownComponent as unknown as { getCombination: LotteryCombination['getCombination'] }
        ).getCombination = originalSimilarityWithUnknownGetCombination;

        const sparseSimilarityProbe = new LotteryCombination({ components: { numbers } });
        const originalSparseSimilarityGetCombination = sparseSimilarityProbe.getCombination.bind(sparseSimilarityProbe);
        const mockedComponents = { numbers };
        (sparseSimilarityProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination =
            () =>
                ({
                    components: mockedComponents,
                    length: sparseSimilarityProbe.length
                }) as unknown as LotteryCombination;

        const originalEntries = Object.entries;
        const sparseSimilaritySpy = vi.spyOn(Object, 'entries').mockImplementation((value: object) => {
            if (value === mockedComponents) {
                return new Array(1) as [string, unknown][];
            }

            return originalEntries(value as Record<string, unknown>);
        });
        try {
            expect(() => sparseSimilarityProbe.similarity()).toThrow('Iterator value undefined is not an entry object');
        } finally {
            sparseSimilaritySpy.mockRestore();
        }
        (sparseSimilarityProbe as unknown as { getCombination: LotteryCombination['getCombination'] }).getCombination =
            originalSparseSimilarityGetCombination;
    });

    it('supports copy conversion from lottery/plain values and validates internal creation', () => {
        const numbers = createNumbers();
        const extra = createExtra();
        const base = new LotteryCombination({ components: { numbers, extra } });

        const fromLottery = base.copy({
            components: {
                numbers: new LotteryCombination({ components: { numbers: createNumbers([6, 7, 8, 9, 10]) } })
            }
        });
        expect(fromLottery.getComponentValues('numbers')).toEqual([6, 7, 8, 9, 10]);

        const fromPlainValues = base.copy({ components: { numbers: [6, 7, 8, 9, 10] } });
        expect(fromPlainValues.getComponentValues('numbers')).toEqual([6, 7, 8, 9, 10]);

        const createCombination = (
            base as unknown as {
                createCombination: (
                    components: Record<string, unknown>,
                    winningRanks: Record<string, number> | null
                ) => LotteryCombination;
            }
        ).createCombination.bind(base);

        expect(() => createCombination({ ghost: [1, 2, 3] }, null)).toThrow('Component "ghost" does not exist');

        expect(new LotteryCombination().toRepr()).toBe('LotteryCombination(winning_ranks={})');
    });

    it('builds empty and with winning ranks only', () => {
        const empty = new LotteryCombination();
        expect(empty.components).toEqual({});
        expect(empty.winningRanks).toEqual({});
        expect(empty.nbWinningRanks).toBe(0);
        expect(empty.minWinningRank).toBeNull();
        expect(empty.maxWinningRank).toBeNull();
        expect(empty.values).toEqual([]);
        expect(empty.rank).toBe(0);
        expect(empty.length).toBe(0);
        expect(empty.count).toBe(0);
        expect(empty.combinations).toBe(0);

        const withRanks = new LotteryCombination({ winningRanks: WINNING_RANKS_NUMBERS });
        expect(withRanks.components).toEqual({});
        expect(withRanks.winningRanks).toEqual(WINNING_RANKS_NUMBERS);
        expect(withRanks.winningRanks).not.toBe(WINNING_RANKS_NUMBERS);
        expect(withRanks.nbWinningRanks).toBe(4);
        expect(withRanks.minWinningRank).toBe(1);
        expect(withRanks.maxWinningRank).toBe(4);
    });

    it('supports options-object constructor and method payloads', () => {
        const numbers = createNumbers();
        const extra = createExtra();
        const base = new LotteryCombination({
            components: { numbers, extra },
            winningRanks: WINNING_RANKS_EXTRA
        });

        const copied = base.copy({ winningRanks: WINNING_RANKS_NUMBERS, components: { extra: [1, 2, 3] } });
        expect(copied.getComponentValues('extra')).toEqual([1, 2, 3]);
        expect(copied.winningRanks).toEqual(WINNING_RANKS_NUMBERS);

        const built = base.getCombination({ combination: [1, 2, 3, 4, 5, 6, 7], components: { extra: [9, 10, 11] } });
        expect(built.values).toEqual([1, 2, 3, 4, 5, 9, 10, 11]);

        expect(base.includes({ combination: 3 })).toBe(true);
        expect(base.getWinningRank({ components: { numbers: [1, 2, 3, 4, 5], extra: [8, 9, 10] } })).toBe(1);
    });

    it('builds from components and from another LotteryCombination', () => {
        const numbers = createNumbers();
        const extra = createExtra();

        const withNumbers = new LotteryCombination({
            winningRanks: WINNING_RANKS_NUMBERS,
            components: { numbers }
        });
        expect(withNumbers.components).toEqual({ numbers });
        expect((withNumbers as unknown as { numbers: BoundCombination }).numbers).toBe(numbers);
        expect(withNumbers.values).toEqual([1, 2, 3, 4, 5]);
        expect(withNumbers.rank).toBe(getCombinationRank([1, 2, 3, 4, 5], 1));
        expect(withNumbers.length).toBe(5);
        expect(withNumbers.count).toBe(5);
        expect(withNumbers.combinations).toBe(NUMBER_COMBINATIONS);

        const withBoth = new LotteryCombination({ components: { numbers, extra } });
        expect(Object.keys(withBoth.components)).toEqual(['numbers', 'extra']);
        expect(withBoth.values).toEqual([1, 2, 3, 4, 5, 8, 9, 10]);
        expect(withBoth.rank).toBe(
            getCombinationRank([1, 2, 3, 4, 5], 1) * EXTRA_COMBINATIONS + getCombinationRank([8, 9, 10], 1)
        );
        expect(withBoth.count).toBe(8);
        expect(withBoth.combinations).toBe(NUMBER_COMBINATIONS * EXTRA_COMBINATIONS);

        const copied = new LotteryCombination(withNumbers);
        expect(copied.components).toEqual(withNumbers.components);
        expect(copied.winningRanks).toEqual(WINNING_RANKS_NUMBERS);

        const merged = new LotteryCombination({ combination: withNumbers, components: { extra } });
        expect(merged.components).toEqual({ numbers, extra });
    });

    it('throws on invalid constructor component type', () => {
        expect(
            () => new LotteryCombination({ components: { numbers: 'invalid' as unknown as BoundCombination } })
        ).toThrow(TypeError);
    });

    it('provides factory behavior', () => {
        const customFactory = ({
            combination = null,
            components = {}
        }: {
            combination?: number | LotteryCombination | null;
            components?: Record<string, BoundCombination>;
        } = {}): LotteryCombination => new LotteryCombination().getCombination({ combination, components });

        expect(LotteryCombination.getCombinationFactory(customFactory)).toBe(customFactory);

        const template = new LotteryCombination({
            components: {
                numbers: new BoundCombination(null, {
                    start: NUMBER_START,
                    end: NUMBER_END,
                    count: NUMBER_COUNT,
                    combinations: NUMBER_COMBINATIONS
                })
            }
        });
        const templateFactory = LotteryCombination.getCombinationFactory(template);

        const generated = templateFactory({ components: { numbers: createNumbers() } });
        expect(generated.equals(template.getCombination({ components: { numbers: createNumbers() } }))).toBe(true);

        const generatedDefault = templateFactory();
        expect(generatedDefault.equals(template.getCombination())).toBe(true);

        const fallbackFactory = LotteryCombination.getCombinationFactory(null);
        expect(fallbackFactory().components).toEqual({});

        const fallbackFactoryFromObject = LotteryCombination.getCombinationFactory({});
        expect(fallbackFactoryFromObject().components).toEqual({});
    });

    it('generates combinations with partitioned rank windows', () => {
        const combination = new LotteryCombination({
            components: {
                numbers: new BoundCombination(null, {
                    start: NUMBER_START,
                    end: NUMBER_END,
                    count: NUMBER_COUNT,
                    combinations: NUMBER_COMBINATIONS
                }),
                extra: new BoundCombination(null, {
                    start: EXTRA_START,
                    end: EXTRA_END,
                    count: EXTRA_COUNT,
                    combinations: EXTRA_COMBINATIONS
                })
            }
        });

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

        const generated1 = combination.generate();
        expect(generated1).toHaveLength(1);
        expect(generated1[0]?.values).toEqual(
            getCombinationFromRank(Math.floor(ranks[0] / EXTRA_COMBINATIONS), 5, 1).concat(
                getCombinationFromRank(ranks[0] % EXTRA_COMBINATIONS, 3, 1)
            )
        );

        const generated2 = combination.generate({ n: 2 });
        expect(generated2).toHaveLength(2);

        const generated3 = combination.generate({ n: 3, partitions: 3 });
        expect(generated3).toHaveLength(3);

        const generated4 = combination.generate({ n: 4, partitions: 2 });
        expect(generated4).toHaveLength(4);

        expect(spy).toHaveBeenCalledTimes(10);
    });

    it('copies and builds combinations from values, rank and components', () => {
        const numbers = new BoundCombination([3, 5, 18, 29, 42], {
            start: NUMBER_START,
            end: NUMBER_END,
            count: NUMBER_COUNT,
            combinations: NUMBER_COMBINATIONS
        });
        const numbers2 = new BoundCombination([6, 9, 12], { start: 1, end: 10, count: 3 });
        const extra = createExtra();

        const combination = new LotteryCombination({
            winningRanks: WINNING_RANKS_NUMBERS,
            components: { numbers, extra }
        });

        const copy = combination.copy();
        expect(copy).not.toBe(combination);
        expect(copy.components).toEqual(combination.components);
        expect(copy.winningRanks).toEqual(combination.winningRanks);

        const copyRanks = combination.copy({ winningRanks: WINNING_RANKS_EXTRA });
        expect(copyRanks.winningRanks).toEqual(WINNING_RANKS_EXTRA);

        const copyNumbers = combination.copy({ components: { numbers: numbers2 } });
        expect(copyNumbers.components).toEqual({ numbers: numbers2, extra });
        expect(copyNumbers.rank).toBe(numbers2.rank * extra.combinations + extra.rank);

        const fromValues = combination.getCombination({ combination: [2, 3, 4, 5, 6, 7, 8] });
        expect(fromValues.values).toEqual([2, 3, 4, 5, 6, 7, 8]);
        expect(fromValues.getComponentValues('numbers')).toEqual([2, 3, 4, 5, 6]);
        expect(fromValues.getComponentValues('extra')).toEqual([7, 8]);

        const overridden = combination.getCombination({
            combination: [2, 3, 4, 5, 6, 7, 8],
            components: { extra: [12, 17] }
        });
        expect(overridden.values).toEqual([2, 3, 4, 5, 6, 12, 17]);

        const fromExtraOnly = combination.getCombination({ components: { extra: [12, 17] } });
        expect(fromExtraOnly.values).toEqual([12, 17]);

        const fromCombination = combination.getCombination({ combination: fromValues });
        expect(fromCombination.values).toEqual([2, 3, 4, 5, 6, 7, 8]);

        const fromCombinationOverride = combination.getCombination({
            combination: fromValues,
            winningRanks: WINNING_RANKS_EXTRA,
            components: { extra: [12, 17] }
        });
        expect(fromCombinationOverride.values).toEqual([2, 3, 4, 5, 6, 12, 17]);
        expect(fromCombinationOverride.winningRanks).toEqual(WINNING_RANKS_EXTRA);

        const fromRank = fromCombinationOverride.getCombination({ combination: combination.rank });
        expect(fromRank.values).toEqual([3, 5, 18, 29, 42, 8, 9, 10]);

        expect(() => combination.getCombination({ components: { stars: [1, 2] as unknown as number[] } })).toThrow(
            'Component "stars" does not exist in the combination.'
        );
    });

    it('gets components and values by name', () => {
        const numbers = createNumbers();
        const extra = createExtra();
        const combination = new LotteryCombination({ components: { numbers, extra } });

        expect(combination.getComponents()).toEqual({});
        expect(combination.getComponents({ numbers: [4, 5, 6, 7, 8] })).toEqual({
            numbers: numbers.copy({ values: [4, 5, 6, 7, 8] })
        });
        expect(combination.getComponents({ extra: [18, 19, 20] })).toEqual({
            extra: extra.copy({ values: [18, 19, 20] })
        });

        expect(combination.getComponent('numbers')).toEqual(numbers);
        expect(combination.getComponent('extra')).toEqual(extra);
        expect(combination.getComponent('missing')).toBeNull();

        expect(combination.getComponentValues('numbers')).toEqual([1, 2, 3, 4, 5]);
        expect(combination.getComponentValues('extra')).toEqual([8, 9, 10]);
        expect(combination.getComponentValues('missing')).toEqual([]);
    });

    it('computes winning rank', () => {
        const numbers = new BoundCombination([1, 2, 3, 4, 5], {
            start: NUMBER_START,
            end: NUMBER_END,
            count: NUMBER_COUNT,
            combinations: NUMBER_COMBINATIONS
        });
        const extra = new BoundCombination([6, 7, 8], {
            start: EXTRA_START,
            end: EXTRA_END,
            count: EXTRA_COUNT,
            combinations: EXTRA_COMBINATIONS
        });

        const numbersOnly = new LotteryCombination({
            winningRanks: WINNING_RANKS_NUMBERS,
            components: { numbers }
        });
        expect(numbersOnly.getWinningRank()).toBeNull();
        expect(numbersOnly.getWinningRank({ components: { numbers: [1, 2, 3, 4, 5] } })).toBe(1);
        expect(numbersOnly.getWinningRank({ components: { numbers: [1, 2] } })).toBe(4);
        expect(numbersOnly.getWinningRank({ components: { numbers: [6, 7, 8, 9, 10] } })).toBeNull();

        const withExtra = new LotteryCombination({
            winningRanks: WINNING_RANKS_EXTRA,
            components: { numbers, extra }
        });
        expect(withExtra.getWinningRank({ components: { numbers: [1, 2, 3, 4, 5], extra: [6, 7, 8] } })).toBe(1);
        expect(withExtra.getWinningRank({ components: { numbers: [1, 2, 3, 4, 6], extra: [6, 7, 9] } })).toBe(6);
        expect(withExtra.getWinningRank({ components: { numbers: [1, 2, 6, 7, 8], extra: [9, 10, 11] } })).toBe(16);
        expect(withExtra.getWinningRank()).toBeNull();

        expect(() => withExtra.getWinningRank({ components: { stars: [1, 2] as unknown as number[] } })).toThrow(
            'Component "stars" does not exist in the combination.'
        );
    });

    it('supports equals/includes/intersects/intersection/compares/similarity', () => {
        const numbers = new BoundCombination([1, 2, 3, 4, 5], {
            start: NUMBER_START,
            end: NUMBER_END,
            count: NUMBER_COUNT,
            combinations: NUMBER_COMBINATIONS
        });
        const extra = new BoundCombination([6, 7, 8], {
            start: EXTRA_START,
            end: EXTRA_END,
            count: EXTRA_COUNT,
            combinations: EXTRA_COMBINATIONS
        });

        const combination1 = new LotteryCombination({ components: { numbers, extra } });
        const combination2 = combination1.getCombination({
            components: { numbers: [1, 2, 3, 4, 5], extra: [6, 7, 8] }
        });
        const combination3 = combination1.getCombination({
            components: { numbers: [1, 2, 4, 5, 7], extra: [6, 7, 8] }
        });

        expect(new LotteryCombination().equals()).toBe(true);
        expect(combination2.equals(combination2)).toBe(true);
        expect(combination2.equals(combination3)).toBe(false);
        expect(combination2.equals({ combination: [1, 2, 3, 4, 5, 6, 7, 8] })).toBe(true);
        expect(combination2.equals({ components: { numbers: [1, 2, 3, 4, 5], extra: [6, 7, 8] } })).toBe(true);

        expect(combination1.includes({ combination: [] })).toBe(true);
        expect(combination1.includes({ combination: [2, 4] })).toBe(true);
        expect(combination1.includes({ combination: [2, 6] })).toBe(false);
        expect(combination1.includes({ combination: 4 })).toBe(true);
        expect(combination1.includes({ combination: 9 })).toBe(false);
        expect(combination1.includes({ components: { numbers: [1, 2, 3, 4, 5] } })).toBe(true);
        expect(combination1.includes({ components: { extra: [6, 7, 9] } })).toBe(false);

        expect(combination1.intersects({ combination: [3] })).toBe(true);
        expect(combination1.intersects({ combination: [6] })).toBe(false);
        expect(combination1.intersects({ components: { numbers: [5] } })).toBe(true);
        expect(combination1.intersects({ components: { extra: [5] } })).toBe(false);
        expect(
            combination1.intersects({
                combination: new LotteryCombination({
                    components: { numbers: numbers.copy({ values: [1, 3, 5, 6, 7] }) }
                })
            })
        ).toBe(true);

        expect(combination1.intersection({ combination: [1, 3, 5, 6, 7] }).values).toEqual([1, 3, 5]);
        expect(combination1.intersection({ combination: [6, 7, 8, 9, 10] }).values).toEqual([]);
        expect(combination1.intersection({ components: { numbers: [1, 2, 5, 6, 7] } }).values).toEqual([1, 2, 5]);
        expect(combination1.intersection({ components: { extra: [3, 6, 7] } }).values).toEqual([6, 7]);

        expect(new LotteryCombination().compares()).toBe(0);
        expect(new LotteryCombination().compares({ combination: combination1 })).toBe(-1);
        expect(combination1.compares()).toBe(1);
        expect(combination1.compares({ combination: [1, 2, 3, 4, 5, 6, 7, 8] })).toBe(0);
        expect(combination1.compares({ combination: [1, 3, 5, 6, 7] })).toBe(-1);
        expect(combination3.compares({ combination: [1, 2, 3, 4, 5] })).toBe(1);

        expect(new LotteryCombination().similarity()).toBe(1);
        expect(new LotteryCombination().similarity({ combination: [1, 2, 3, 4, 5] })).toBe(1);
        expect(combination1.similarity()).toBe(0);
        expect(combination1.similarity({ combination: [1, 2, 3, 4, 5, 6, 7, 8] })).toBe(1);
        expect(combination1.similarity({ combination: [1, 2, 3, 4, 5] })).toBe(5 / 8);
        expect(combination1.similarity({ combination: [6, 7, 8, 9, 10] })).toBe(0);
        expect(combination1.similarity({ combination: combination3 })).toBe(7 / 8);

        expect(() => combination1.equals({ components: { dummy: [1, 2, 3] as unknown as number[] } })).toThrow(
            'Component "dummy" does not exist'
        );
        expect(() => combination1.includes({ components: { dummy: [1, 2, 3] as unknown as number[] } })).toThrow(
            'Component "dummy" does not exist'
        );
        expect(() => combination1.intersects({ components: { dummy: [1, 2, 3] as unknown as number[] } })).toThrow(
            'Component "dummy" does not exist'
        );
        expect(() => combination1.intersection({ components: { dummy: [1, 2, 3] as unknown as number[] } })).toThrow(
            'Component "dummy" does not exist'
        );
        expect(() => combination1.compares({ components: { dummy: [1, 2, 3] as unknown as number[] } })).toThrow(
            'Component "dummy" does not exist'
        );
        expect(() => combination1.similarity({ components: { dummy: [1, 2, 3] as unknown as number[] } })).toThrow(
            'Component "dummy" does not exist'
        );
    });

    it('supports iteration, index access, string/repr/hash helpers', () => {
        const numbers = createNumbers();
        const extra = new BoundCombination([8, 7, 6], {
            start: EXTRA_START,
            end: EXTRA_END,
            count: EXTRA_COUNT,
            combinations: EXTRA_COMBINATIONS
        });
        const combination = new LotteryCombination({ components: { numbers, extra } });

        expect([...combination]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        expect(combination.get(0)).toBe(1);
        expect(combination.get(7)).toBe(8);
        expect(() => combination.get(8)).toThrow(RangeError);

        expect(combination.toString()).toBe('numbers: [ 1,  2,  3,  4,  5] extra: [ 6,  7,  8]');
        expect(combination.toRepr()).toBe(
            'LotteryCombination(numbers=BoundCombination(values=[1,2,3,4,5], rank=None, start=1, end=50, count=5, combinations=2118760), extra=BoundCombination(values=[6,7,8], rank=None, start=1, end=20, count=3, combinations=1140), winning_ranks={})'
        );

        const same = new LotteryCombination({ components: { numbers } });
        const same2 = new LotteryCombination({ components: { numbers } });
        const different = new LotteryCombination({ components: { numbers, extra } });

        expect(same.hashCode()).toBe(same2.hashCode());
        expect(same.hashCode()).not.toBe(different.hashCode());
        expect(same.hashCode()).toBe(same.rank);
        expect(combination.has(4)).toBe(true);
        expect(combination.has(9)).toBe(false);
    });
});
