import { getCombinationFromRank, getCombinationRank } from './rank.ts';
import type {
    CombinationInputWithRank,
    CombinationNumber,
    CombinationNumbers,
    CombinationRank,
    CombinationValues
} from './types.ts';

const DEFAULT_START = 1;

const isInputWithRank = (value: unknown): value is CombinationInputWithRank => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return Object.hasOwn(candidate, 'values') || Object.hasOwn(candidate, 'rank');
};

export type CombinationInputValues = CombinationNumbers | Combination;

export type CombinationInput = CombinationRank | CombinationInputValues | null | undefined;

export type CombinationInputOrRank = CombinationInput | CombinationInputWithRank;

export interface CombinationOptions {
    rank?: CombinationRank | null;
    start?: number | null;
}

export interface CombinationCopyOptions {
    values?: CombinationInputOrRank | null;
    rank?: CombinationRank | null;
    start?: number | null;
}

/**
 * A class representing a combination of values.
 *
 * The class stores unique values and exposes deterministic sorted values,
 * lexicographic rank helpers, set-style predicates, and ordering helpers.
 *
 * @param values - The values of the combination.
 * @param rank - The lexicographic rank of the combination.
 * @param start - The starting offset for combination values.
 *
 * @example
 * const combination = new Combination([12, 3, 42, 6, 22]);
 * combination.values; // [3, 6, 12, 22, 42]
 * combination.rank; // 755560
 *
 * @example
 * const empty = new Combination();
 * empty.values; // []
 * empty.rank; // 0
 */
export class Combination {
    protected readonly _values: Set<CombinationNumber>;

    protected _rank: CombinationRank | null;

    protected readonly _start: number;

    private _sortedValuesCache: CombinationValues | undefined;

    public constructor(
        values: CombinationInputValues | CombinationInputWithRank | null = null,
        { rank = null, start = null }: CombinationOptions = {}
    ) {
        let candidateValues: CombinationNumbers | Combination | null | undefined;

        if (isInputWithRank(values)) {
            if (rank === null) {
                rank = values.rank ?? null;
            }
            candidateValues = values.values;
        } else {
            candidateValues = values;
        }

        if (candidateValues instanceof Combination) {
            if (start === null) {
                start = candidateValues._start;
            }

            if (rank === null) {
                rank = candidateValues._rank;
            }

            candidateValues = candidateValues.getValues(start);
        }

        const valuesList = candidateValues ? [...candidateValues] : [];

        if (valuesList.length === 0) {
            rank = null;
        }

        this._values = new Set(valuesList);
        this._rank = rank;
        this._start = start ?? DEFAULT_START;
    }

    /**
     * Get sorted combination values.
     *
     * @returns Sorted values.
     *
     * @example
     * new Combination([3, 1, 2]).values; // [1, 2, 3]
     */
    public get values(): CombinationValues {
        if (this._sortedValuesCache === undefined) {
            this._sortedValuesCache = [...this._values].sort((left, right) => left - right);
        }

        return this._sortedValuesCache;
    }

    /**
     * Get lexicographic rank.
     *
     * If rank is not explicitly provided, it is computed lazily from values.
     *
     * @returns Lexicographic rank.
     *
     * @example
     * new Combination([3, 1, 2]).rank; // 0
     */
    public get rank(): CombinationRank {
        if (this._rank === null) {
            this._rank = getCombinationRank(this._values, this._start);
        }

        return this._rank;
    }

    /**
     * Get the stored rank without triggering lazy rank computation.
     *
     * @returns Stored rank or `null` when it has not been set/computed yet.
     */
    public get storedRank(): CombinationRank | null {
        return this._rank;
    }

    /**
     * Get number of values.
     *
     * @returns Number of unique values in the combination.
     *
     * @example
     * new Combination([3, 1, 2]).length; // 3
     */
    public get length(): number {
        return this._values.size;
    }

    /**
     * Get the starting offset of the combination.
     *
     * @returns Start offset.
     *
     * @example
     * new Combination([3, 1, 2], null, 0).start; // 0
     */
    public get start(): number {
        return this._start;
    }

    /**
     * Return a copy with optional modifications.
     *
     * @param values - Replacement values. `null` keeps current values. If an integer is provided,
     * it is treated as the lexicographic rank of the combination.
     * @param rank - Optional explicit rank override.
     * @param start - Optional new start offset.
     * @returns A new `Combination`.
     *
     * @example
     * const base = new Combination([4, 5, 6], { start: 1 });
     * base.copy({ values: [2, 3, 4] }).values; // [2, 3, 4]
     */
    public copy({ values = null, rank = null, start = null }: CombinationCopyOptions = {}): Combination {
        const targetStart = start ?? this._start;
        let sourceRank: CombinationRank | null = rank;
        let sourceValues: CombinationInputOrRank | null = values;

        if (values === null) {
            sourceValues = this.getValues(targetStart);
            sourceRank = this._rank ?? rank;
        } else if (typeof values === 'number') {
            sourceRank = rank ?? values;
            sourceValues = getCombinationFromRank(values, this.length, targetStart);
        }

        return new Combination(sourceValues as CombinationInputValues | CombinationInputWithRank, {
            rank: sourceRank,
            start: targetStart
        });
    }

    /**
     * Get values with an optional start offset transformation.
     *
     * @param start - Optional target start offset.
     * @returns Values adjusted to the requested start offset.
     *
     * @example
     * new Combination([1, 2, 3]).getValues(0); // [0, 1, 2]
     */
    public getValues(start?: number): CombinationValues {
        if (start === undefined || start === this._start) {
            return this.values;
        }

        const offset = start - this._start;
        return this.values.map(value => value + offset);
    }

    /**
     * Check whether this combination equals another combination or rank.
     *
     * @param combination - Candidate combination/rank.
     * @returns `true` when values/rank are equal.
     *
     * @example
     * const base = new Combination([1, 2, 3]);
     * base.equals([1, 2, 3]); // true
     * base.equals(0); // true
     */
    public equals(combination: CombinationInput): boolean {
        if (combination instanceof Combination) {
            const values = combination.getValues(this._start);
            return this.values.length === values.length && this.values.every((value, index) => value === values[index]);
        }

        if (typeof combination === 'number') {
            return this.rank === combination;
        }

        const otherValues = combination ? new Set(combination) : new Set<number>();
        if (this._values.size !== otherValues.size) {
            return false;
        }

        for (const value of this._values) {
            if (!otherValues.has(value)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check whether this combination includes another combination or a value.
     *
     * @param combination - Candidate value(s).
     * @returns `true` when all candidate values are included.
     *
     * @example
     * const base = new Combination([2, 4, 6]);
     * base.includes(4); // true
     * base.includes([2, 5]); // false
     */
    public includes(combination: CombinationNumber | CombinationInputValues | null | undefined): boolean {
        if (typeof combination === 'number') {
            return this._values.has(combination);
        }

        const otherValues =
            combination instanceof Combination ? combination.getValues(this._start) : (combination ?? []);

        for (const value of otherValues) {
            if (!this._values.has(value)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check whether this combination intersects another combination.
     *
     * @param combination - Candidate value(s).
     * @returns `true` when at least one value overlaps.
     *
     * @example
     * new Combination([1, 2, 3]).intersects([3, 4]); // true
     */
    public intersects(combination: CombinationInputValues | null | undefined): boolean {
        const otherValues =
            combination instanceof Combination ? combination.getValues(this._start) : (combination ?? []);

        for (const value of otherValues) {
            if (this._values.has(value)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get the intersection with another combination.
     *
     * @param combination - Candidate value(s).
     * @returns A new `Combination` containing shared values.
     *
     * @example
     * new Combination([1, 2, 3]).intersection([3, 4, 5]).values; // [3]
     */
    public intersection(combination: CombinationInputValues | null | undefined): Combination {
        const otherValues =
            combination instanceof Combination ? combination.getValues(this._start) : (combination ?? []);
        const otherSet = new Set(otherValues);
        const commonValues = [...this._values].filter(value => otherSet.has(value));

        return new Combination(commonValues, { start: this._start });
    }

    /**
     * Compare this combination to another combination or rank.
     *
     * @param combination - Candidate combination/rank.
     * @returns `-1`, `0`, or `1`.
     *
     * @example
     * new Combination([1, 2, 3]).compares([1, 2, 4]); // -1
     */
    public compares(combination: CombinationInput): number {
        if (typeof combination === 'number') {
            if (this.rank === combination) {
                return 0;
            }

            return this.rank > combination ? 1 : -1;
        }

        const otherCombination =
            combination instanceof Combination
                ? combination
                : new Combination(combination ?? null, { start: this._start });

        if (this.equals(otherCombination)) {
            return 0;
        }

        return this.rank - otherCombination.rank > 0 ? 1 : -1;
    }

    /**
     * Calculate similarity ratio with another combination.
     *
     * @param combination - Candidate values.
     * @returns Similarity ratio in `[0, 1]`.
     *
     * @example
     * new Combination([1, 2, 3]).similarity([2, 3, 4]); // 0.666...
     */
    public similarity(combination: CombinationInputValues | null | undefined): number {
        if (this.equals(combination)) {
            return 1;
        }

        if (this.length === 0) {
            return 0;
        }

        return this.intersection(combination).length / this.length;
    }

    /**
     * Get a value by index.
     *
     * @param index - Zero-based value index.
     * @returns Value at index.
     *
     * @throws {RangeError} Thrown when index is out of bounds.
     */
    public get(index: number): CombinationNumber {
        if (!Number.isInteger(index) || index < 0 || index >= this.length) {
            throw new RangeError(`Index ${index} is out of bounds.`);
        }

        return this.values[index] as CombinationNumber;
    }

    /**
     * Get an integer hash representation.
     *
     * @returns Rank-based hash.
     *
     * @example
     * new Combination([1, 2, 3]).hashCode(); // 0
     */
    public hashCode(): number {
        return this.rank;
    }

    /**
     * Return a string representation.
     *
     * @returns Representation string.
     *
     * @example
     * new Combination([1, 2, 3]).toRepr();
     */
    public toRepr(): string {
        return `Combination(values=${JSON.stringify(this.values)}, rank=${this._rank === null ? 'None' : String(this._rank)}, start=${this._start})`;
    }

    public toString(): string {
        return JSON.stringify(this.values);
    }

    public *[Symbol.iterator](): Iterator<CombinationNumber> {
        yield* this.values;
    }
}
