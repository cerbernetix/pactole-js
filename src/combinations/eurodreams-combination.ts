import { BoundCombination, type CombinationInputOrRank } from './combination.ts';
import { createWinningRanks, LotteryCombination, type CombinationWinningRanks } from './lottery-combination.ts';
import { comb } from './rank.ts';

// game constants
export const EURODREAMS_NUMBER_COUNT = 6;
export const EURODREAMS_NUMBER_START = 1;
export const EURODREAMS_NUMBER_END = 40;
export const EURODREAMS_NUMBER_COMBINATIONS = comb(
    EURODREAMS_NUMBER_END - EURODREAMS_NUMBER_START + 1,
    EURODREAMS_NUMBER_COUNT
);

export const EURODREAMS_DREAM_COUNT = 1;
export const EURODREAMS_DREAM_START = 1;
export const EURODREAMS_DREAM_END = 5;
export const EURODREAMS_DREAM_COMBINATIONS = comb(
    EURODREAMS_DREAM_END - EURODREAMS_DREAM_START + 1,
    EURODREAMS_DREAM_COUNT
);

export const EURODREAMS_TOTAL_COMBINATIONS = EURODREAMS_NUMBER_COMBINATIONS * EURODREAMS_DREAM_COMBINATIONS;

export const EURODREAMS_WINNING_RANKS: CombinationWinningRanks = createWinningRanks([
    [[6, 1], 1],
    [[6, 0], 2],
    [[5, 1], 3],
    [[5, 0], 3],
    [[4, 1], 4],
    [[4, 0], 4],
    [[3, 1], 5],
    [[3, 0], 5],
    [[2, 1], 6],
    [[2, 0], 6]
]);

function isPlainObject(value: unknown): value is object {
    return Object.prototype.toString.call(value) === '[object Object]';
}

export interface EuroDreamsCombinationOptions {
    numbers?: CombinationInputOrRank | EuroDreamsCombination | null;
    dream?: CombinationInputOrRank | null;
}

/**
 * Preconfigured EuroDreams lottery combination.
 *
 * The constructor accepts an options object with optional `numbers` and
 * `dream` fields.  It also supports passing a flattened array where the dream
 * value immediately follows the main numbers; when `dream` is omitted the
 * first 6 elements are treated as main values and the following 1 as the dream
 * number.
 *
 * @param options.numbers - main numbers, a rank, another
 *   EuroDreamsCombination (copy semantics), or an iterable that may
 *   include the dream value when `dream` is omitted.
 * @param options.dream - dream number or rank; if `null` and
 *   `numbers` is an iterable the trailing element is treated as the dream.
 *
 * @example
 * const comb = new EuroDreamsCombination({ numbers: [3, 5, 12, 23, 44, 6], dream: [2] });
 * comb.numbers.toString();
 * comb.dream.toString();
 */
export class EuroDreamsCombination extends LotteryCombination {
    declare public readonly numbers: BoundCombination;
    declare public readonly dream: BoundCombination;

    public constructor({ numbers = null, dream = null }: EuroDreamsCombinationOptions = {}) {
        let num: CombinationInputOrRank | null = numbers;
        let drm: CombinationInputOrRank | null = dream;

        if (num instanceof EuroDreamsCombination) {
            const baseDream = num.dream.copy({ values: drm });
            const baseNumbers = num.numbers;
            super({ components: { numbers: baseNumbers, dream: baseDream }, winningRanks: EURODREAMS_WINNING_RANKS });
            return;
        }

        if (drm === null && num != null && typeof num !== 'number' && !isPlainObject(num)) {
            const arr = Array.from(num as Iterable<number>);
            drm = arr.slice(EURODREAMS_NUMBER_COUNT, EURODREAMS_NUMBER_COUNT + EURODREAMS_DREAM_COUNT);
            num = arr.slice(0, EURODREAMS_NUMBER_COUNT);
        }

        super({
            components: {
                numbers: new BoundCombination(num, {
                    start: EURODREAMS_NUMBER_START,
                    end: EURODREAMS_NUMBER_END,
                    count: EURODREAMS_NUMBER_COUNT,
                    combinations: EURODREAMS_NUMBER_COMBINATIONS
                }),
                dream: new BoundCombination(drm, {
                    start: EURODREAMS_DREAM_START,
                    end: EURODREAMS_DREAM_END,
                    count: EURODREAMS_DREAM_COUNT,
                    combinations: EURODREAMS_DREAM_COMBINATIONS
                })
            },
            winningRanks: EURODREAMS_WINNING_RANKS
        });
    }

    protected createCombination(
        components: Record<string, CombinationInputOrRank | LotteryCombination>,
        _winningRanks: CombinationWinningRanks | null
    ): this {
        // parameter is unused but retained for compatibility with base class
        void _winningRanks;
        const built = this.buildComponents(components);
        return new EuroDreamsCombination({ numbers: built.numbers, dream: built.dream }) as this;
    }

    /**
     * Return a string representation.
     *
     * @returns Representation string.
     */
    public toRepr(): string {
        const nums = JSON.stringify(this.numbers.values);
        const drm = JSON.stringify(this.dream.values);
        return `EuroDreamsCombination(numbers=${nums}, dream=${drm})`;
    }
}
