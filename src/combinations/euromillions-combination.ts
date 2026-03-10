import { BoundCombination, type CombinationInputOrRank } from './combination.ts';
import { createWinningRanks, LotteryCombination, type CombinationWinningRanks } from './lottery-combination.ts';
import { comb } from './rank.ts';

// game constants
export const EUROMILLIONS_NUMBER_COUNT = 5;
export const EUROMILLIONS_NUMBER_START = 1;
export const EUROMILLIONS_NUMBER_END = 50;
export const EUROMILLIONS_NUMBER_COMBINATIONS = comb(
    EUROMILLIONS_NUMBER_END - EUROMILLIONS_NUMBER_START + 1,
    EUROMILLIONS_NUMBER_COUNT
);

export const EUROMILLIONS_STAR_COUNT = 2;
export const EUROMILLIONS_STAR_START = 1;
export const EUROMILLIONS_STAR_END = 12;
export const EUROMILLIONS_STAR_COMBINATIONS = comb(
    EUROMILLIONS_STAR_END - EUROMILLIONS_STAR_START + 1,
    EUROMILLIONS_STAR_COUNT
);

export const EUROMILLIONS_TOTAL_COMBINATIONS = EUROMILLIONS_NUMBER_COMBINATIONS * EUROMILLIONS_STAR_COMBINATIONS;

export const EUROMILLIONS_WINNING_RANKS: CombinationWinningRanks = createWinningRanks([
    [[5, 2], 1],
    [[5, 1], 2],
    [[5, 0], 3],
    [[4, 2], 4],
    [[4, 1], 5],
    [[3, 2], 6],
    [[4, 0], 7],
    [[2, 2], 8],
    [[3, 1], 9],
    [[3, 0], 10],
    [[1, 2], 11],
    [[2, 1], 12],
    [[2, 0], 13]
]);

function isPlainObject(value: unknown): value is object {
    return Object.prototype.toString.call(value) === '[object Object]';
}

export interface EuroMillionsCombinationOptions {
    numbers?: CombinationInputOrRank | EuroMillionsCombination | null;
    stars?: CombinationInputOrRank | null;
}

/**
 * Preconfigured EuroMillions lottery combination.
 *
 * The constructor accepts an options object with optional `numbers` and
 * `stars` fields. It also supports passing a flattened array where the star
 * values immediately follow the main numbers; when `stars` is omitted the
 * first 5 elements are treated as main values and the following 2 as stars.
 *
 * @param options.numbers - main numbers, a rank, another
 *   EuroMillionsCombination (copy semantics), or an iterable that may
 *   include stars when `stars` is omitted.
 * @param options.stars - star numbers or a rank; if `null` and `numbers`
 *   is an iterable the trailing elements are treated as stars.
 *
 * @example
 * const comb = new EuroMillionsCombination({ numbers: [3, 5, 12, 23, 44], stars: [2, 9] });
 * comb.numbers.toString();
 * comb.stars.toString();
 */
export class EuroMillionsCombination extends LotteryCombination {
    declare public readonly numbers: BoundCombination;
    declare public readonly stars: BoundCombination;

    public constructor({ numbers = null, stars = null }: EuroMillionsCombinationOptions = {}) {
        let num: CombinationInputOrRank | null = numbers;
        let star: CombinationInputOrRank | null = stars;

        if (num instanceof EuroMillionsCombination) {
            const existingStars = num.stars.copy({ values: star });
            const existingNumbers = num.numbers;

            super({
                components: { numbers: existingNumbers, stars: existingStars },
                winningRanks: EUROMILLIONS_WINNING_RANKS
            });
            return;
        }

        if (star === null && num != null && typeof num !== 'number' && !isPlainObject(num)) {
            const arr = Array.from(num as Iterable<number>);
            star = arr.slice(EUROMILLIONS_NUMBER_COUNT, EUROMILLIONS_NUMBER_COUNT + EUROMILLIONS_STAR_COUNT);
            num = arr.slice(0, EUROMILLIONS_NUMBER_COUNT);
        }

        super({
            components: {
                numbers: new BoundCombination(num, {
                    start: EUROMILLIONS_NUMBER_START,
                    end: EUROMILLIONS_NUMBER_END,
                    count: EUROMILLIONS_NUMBER_COUNT,
                    combinations: EUROMILLIONS_NUMBER_COMBINATIONS
                }),
                stars: new BoundCombination(star, {
                    start: EUROMILLIONS_STAR_START,
                    end: EUROMILLIONS_STAR_END,
                    count: EUROMILLIONS_STAR_COUNT,
                    combinations: EUROMILLIONS_STAR_COMBINATIONS
                })
            },
            winningRanks: EUROMILLIONS_WINNING_RANKS
        });
    }

    protected createCombination(
        components: Record<string, CombinationInputOrRank | LotteryCombination>,
        _winningRanks: CombinationWinningRanks | null
    ): this {
        // parameter exists purely for signature compatibility with base class
        void _winningRanks;
        const built = this.buildComponents(components);
        return new EuroMillionsCombination({
            numbers: built.numbers,
            stars: built.stars
        }) as this;
    }

    /**
     * Return a string representation.
     *
     * @returns Representation string.
     */
    public toRepr(): string {
        const nums = JSON.stringify(this.numbers.values);
        const sts = JSON.stringify(this.stars.values);
        return `EuroMillionsCombination(numbers=${nums}, stars=${sts})`;
    }
}
