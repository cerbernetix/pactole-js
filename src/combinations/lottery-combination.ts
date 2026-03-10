import { BoundCombination, type CombinationInput, type CombinationInputOrRank } from './combination.ts';
import { generate } from './rank.ts';
import type { CombinationNumber, CombinationRank, CombinationValues } from './types.ts';

/** Winning pattern of component intersection lengths. */
export type CombinationWinningPattern = readonly number[];

/**
 * Winning-rank lookup map.
 *
 * Keys are encoded component-length tuples, for example `"5,2"`.
 */
export type CombinationWinningRanks = Record<string, CombinationRank>;

/** Named map of lottery components. */
export type CombinationComponents = Record<string, BoundCombination>;

/**
 * Factory signature used to construct `LotteryCombination` values.
 *
 * @param combination - Optional rank/value/base combination input.
 * @param components - Optional component overrides.
 * @returns A constructed `LotteryCombination`.
 */
export type CombinationFactory = (options?: {
    combination?: CombinationInput | LotteryCombination;
    components?: Record<string, CombinationInputOrRank | LotteryCombination>;
}) => LotteryCombination;

export interface LotteryCombinationOptions {
    combination?: LotteryCombination | null;
    winningRanks?: CombinationWinningRanks | null;
    components?: CombinationComponents;
}

export interface LotteryCombinationCopyOptions {
    winningRanks?: CombinationWinningRanks | null;
    components?: Record<string, CombinationInputOrRank | LotteryCombination>;
}

export interface LotteryCombinationBuildOptions {
    combination?: CombinationInput | LotteryCombination | null;
    winningRanks?: CombinationWinningRanks | null;
    components?: Record<string, CombinationInputOrRank | LotteryCombination>;
}

export interface LotteryCombinationMatchOptions {
    combination?: CombinationInput | LotteryCombination | null;
    components?: Record<string, CombinationInputOrRank | LotteryCombination>;
}

export interface LotteryCombinationIncludesOptions {
    combination?: CombinationNumber | CombinationInput | LotteryCombination | null;
    components?: Record<string, CombinationInputOrRank | LotteryCombination>;
}

export interface LotteryCombinationGenerateOptions {
    n?: number;
    partitions?: number;
}

const isCombinationFactory = (value: unknown): value is CombinationFactory => typeof value === 'function';

const toWinningRankKey = (pattern: CombinationWinningPattern): string => pattern.join(',');

const cloneWinningRanks = (winningRanks: CombinationWinningRanks): CombinationWinningRanks => ({ ...winningRanks });

/**
 * Class representing a Lottery combination.
 *
 * A Lottery combination is a compound combination that can consist of multiple
 * components (for example main numbers and bonus numbers).
 *
 * @param combination - The combination to copy from.
 * @param winningRanks - The winning-rank mapping.
 * @param components - The component combinations.
 *
 * @throws {TypeError} Thrown when a component is not a `BoundCombination` instance.
 *
 * @example
 * const numbers = new BoundCombination({ values: [1, 2, 3, 4, 5], start: 1, end: 50, count: 5 });
 * const stars = new BoundCombination({ values: [1, 2], start: 1, end: 12, count: 2 });
 * const combination = new LotteryCombination({ components: { numbers, stars } });
 * combination.values; // [1, 2, 3, 4, 5, 1, 2]
 */
export class LotteryCombination {
    private readonly _components: CombinationComponents;

    private readonly _winningRanks: CombinationWinningRanks;

    public constructor({ combination = null, winningRanks = null, components = {} }: LotteryCombinationOptions = {}) {
        let sourceComponents = { ...components };
        let sourceWinningRanks = winningRanks;

        if (combination instanceof LotteryCombination) {
            sourceComponents = { ...combination._components, ...sourceComponents };
            if (sourceWinningRanks === null) {
                sourceWinningRanks = cloneWinningRanks(combination._winningRanks);
            }
        }

        const effectiveWinningRanks = sourceWinningRanks ?? {};

        for (const component of Object.values(sourceComponents)) {
            if (!(component instanceof BoundCombination)) {
                throw new TypeError('All components must be instances of BoundCombination.');
            }
        }

        this._components = sourceComponents;
        this._winningRanks = effectiveWinningRanks;

        for (const name of Object.keys(this._components)) {
            if (name in this) {
                continue;
            }

            Object.defineProperty(this, name, {
                enumerable: true,
                configurable: true,
                get: () => this._components[name]
            });
        }
    }

    /**
     * Get a copy of component mapping.
     *
     * @returns Shallow copy of component map.
     *
     * @example
     * const lottery = new LotteryCombination({ components: { numbers: new BoundCombination([1, 2, 3], { start: 1, end: 50, count: 5 }) } });
     * Object.keys(lottery.components); // ['numbers']
     */
    public get components(): CombinationComponents {
        return { ...this._components };
    }

    /**
     * Get flattened values of all components in declaration order.
     *
     * @returns Flattened values.
     *
     * @example
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * const stars = new BoundCombination([1, 2], null, 1, 12, 2);
     * new LotteryCombination({ components: { numbers, stars } }).values; // [1, 2, 3, 4, 5, 1, 2]
     */
    public get values(): CombinationValues {
        return Object.values(this._components).flatMap(component => component.values);
    }

    /**
     * Get mixed rank of all components.
     *
     * @returns Combined rank.
     *
     * @example
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * const stars = new BoundCombination([1, 2], null, 1, 12, 2);
     * new LotteryCombination({ components: { numbers, stars } }).rank;
     */
    public get rank(): CombinationRank {
        let rank = 0;
        let multiplier = 1;

        const values = Object.values(this._components);
        for (let index = values.length - 1; index >= 0; index -= 1) {
            const component = values[index];
            if (!component) {
                continue;
            }

            rank += component.rank * multiplier;
            multiplier *= component.combinations;
        }

        return rank;
    }

    /**
     * Get flattened value length.
     *
     * @returns Number of selected values across components.
     *
     * @example
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * const stars = new BoundCombination([1, 2], null, 1, 12, 2);
     * new LotteryCombination({ components: { numbers, stars } }).length; // 7
     */
    public get length(): number {
        return Object.values(this._components).reduce((accumulator, component) => accumulator + component.length, 0);
    }

    /**
     * Get configured component total count.
     *
     * @returns Sum of configured component counts.
     *
     * @example
     * const numbers = new BoundCombination(null, null, 1, 50, 5);
     * const stars = new BoundCombination(null, null, 1, 12, 2);
     * new LotteryCombination({ components: { numbers, stars } }).count; // 7
     */
    public get count(): number {
        return Object.values(this._components).reduce((accumulator, component) => accumulator + component.count, 0);
    }

    /**
     * Get total number of possible combinations.
     *
     * @returns Product of component combinations or `0` for empty lottery.
     *
     * @example
     * new LotteryCombination().combinations; // 0
     */
    public get combinations(): number {
        const values = Object.values(this._components);
        if (values.length === 0) {
            return 0;
        }

        return values.reduce((accumulator, component) => accumulator * component.combinations, 1);
    }

    /**
     * Get a copy of winning-rank mapping.
     *
     * @returns Winning-rank map copy.
     *
     * @example
     * const lottery = new LotteryCombination({ winningRanks: { '5,2': 1 } });
     * lottery.winningRanks; // { '5,2': 1 }
     */
    public get winningRanks(): CombinationWinningRanks {
        return cloneWinningRanks(this._winningRanks);
    }

    /**
     * Get winning-rank span length.
     *
     * @returns Span length between min and max rank values (inclusive).
     *
     * @example
     * new LotteryCombination({ winningRanks: { '5,2': 1, '4,2': 4 } }).nbWinningRanks; // 4
     */
    public get nbWinningRanks(): number {
        const values = Object.values(this._winningRanks);
        if (values.length === 0) {
            return 0;
        }

        return Math.max(...values) - Math.min(...values) + 1;
    }

    /**
     * Get minimum winning rank.
     *
     * @returns Minimum winning rank or `null`.
     *
     * @example
     * new LotteryCombination({ winningRanks: { '5,2': 1, '4,2': 4 } }).minWinningRank; // 1
     */
    public get minWinningRank(): number | null {
        const values = Object.values(this._winningRanks);
        if (values.length === 0) {
            return null;
        }

        return Math.min(...values);
    }

    /**
     * Get maximum winning rank.
     *
     * @returns Maximum winning rank or `null`.
     *
     * @example
     * new LotteryCombination({ winningRanks: { '5,2': 1, '4,2': 4 } }).maxWinningRank; // 4
     */
    public get maxWinningRank(): number | null {
        const values = Object.values(this._winningRanks);
        if (values.length === 0) {
            return null;
        }

        return Math.max(...values);
    }

    /**
     * Normalize a factory input.
     *
     * Accepts a direct factory function, a template `LotteryCombination`, or
     * any fallback value (resolved to an empty-default factory).
     *
     * @param combinationFactory - Factory-like input.
     * @returns Normalized factory function.
     *
     * @example
     * const factory = LotteryCombination.getCombinationFactory(null);
     * factory(undefined, { components: {} }); // LotteryCombination
     */
    public static getCombinationFactory(
        combinationFactory: CombinationFactory | LotteryCombination | unknown
    ): (options?: {
        combination?: CombinationInput | LotteryCombination;
        components?: Record<string, CombinationInputOrRank | LotteryCombination>;
    }) => LotteryCombination {
        if (combinationFactory instanceof LotteryCombination) {
            return ({ combination, components = {} } = {}) =>
                combinationFactory.getCombination({ combination, components });
        }

        if (!isCombinationFactory(combinationFactory)) {
            const fallback = new LotteryCombination();
            return ({ combination, components = {} } = {}) => fallback.getCombination({ combination, components });
        }

        return combinationFactory;
    }

    /**
     * Generate random combinations with the same component schema.
     *
     * @param n - Number of combinations to generate.
     * @param partitions - Number of rank partitions used during generation.
     * @returns Generated combinations.
     *
     * @example
     * const numbers = new BoundCombination(null, { start: 1, end: 50, count: 5 });
     * const stars = new BoundCombination(null, { start: 1, end: 12, count: 2 });
     * new LotteryCombination({ components: { numbers, stars } }).generate({ n: 2 }).length; // 2
     */
    public generate({ n = 1, partitions = 1 }: LotteryCombinationGenerateOptions = {}): this[] {
        return Array.from(
            generate(this.combinations, n, partitions),
            rank => this.getCombination({ combination: rank }) as this
        );
    }

    /**
     * Copy this combination with optional overrides.
     *
     * @param winningRanks - Optional replacement winning-rank map.
     * @param components - Optional component overrides.
     * @returns New lottery combination.
     *
     * @example
     * const numbers = new BoundCombination({ values: [1, 2, 3, 4, 5], start: 1, end: 50, count: 5 });
     * const base = new LotteryCombination({ winningRanks: { '5': 1 }, components: { numbers } });
     * base.copy({ winningRanks: { '4': 2 } }).winningRanks; // { '4': 2 }
     */
    public copy({ winningRanks = null, components = {} }: LotteryCombinationCopyOptions = {}): this {
        const targetWinningRanks = winningRanks ?? this._winningRanks;

        const mergedComponents = Object.fromEntries(
            Object.entries(this._components).map(([name, value]) => [name, components[name] || value])
        );

        return this.createCombination(mergedComponents, targetWinningRanks) as this;
    }

    /**
     * Build a combination from rank, values, or another lottery combination.
     *
     * @param combination - Optional rank/values/combination source.
     * @param winningRanks - Optional winning-rank override.
     * @param components - Optional component overrides.
     * @returns Constructed lottery combination.
     *
     * @throws {Error} Thrown when an unknown component name is provided.
     *
     * @example
     * const numbers = new BoundCombination({ start: 1, end: 50, count: 5 });
     * const stars = new BoundCombination({ start: 1, end: 12, count: 2 });
     * const lottery = new LotteryCombination({ components: { numbers, stars } });
     * lottery.getCombination({ combination: [1, 2, 3, 4, 5, 1, 2] }).values; // [1, 2, 3, 4, 5, 1, 2]
     */
    public getCombination({
        combination = null,
        winningRanks = null,
        components = {}
    }: LotteryCombinationBuildOptions = {}): this {
        let normalizedComponents = this.getComponents(components);

        if (combination instanceof LotteryCombination) {
            normalizedComponents = { ...combination._components, ...normalizedComponents };
            if (winningRanks === null) {
                winningRanks = cloneWinningRanks(combination._winningRanks);
            }
        } else if (combination !== null && combination !== undefined) {
            const fromCombination: CombinationComponents = {};

            if (typeof combination === 'number') {
                let rank = combination;
                const entries = Object.entries(this._components).reverse();

                for (const [name, component] of entries) {
                    fromCombination[name] = component.copy({ values: rank % component.combinations });
                    rank = Math.floor(rank / component.combinations);
                }

                normalizedComponents = {
                    ...Object.fromEntries(Object.entries(fromCombination).reverse()),
                    ...normalizedComponents
                };
            } else {
                let values = [...combination];

                for (const [name, component] of Object.entries(this._components)) {
                    fromCombination[name] = component.copy({ values: values.slice(0, component.count) });
                    values = values.length > component.count ? values.slice(component.count) : [];
                }

                normalizedComponents = { ...fromCombination, ...normalizedComponents };
            }
        }

        const targetWinningRanks = winningRanks ?? this._winningRanks;
        return this.createCombination(normalizedComponents, targetWinningRanks) as this;
    }

    /**
     * Build updated components for known component names.
     *
     * @param components - Component update payload.
     * @returns Built component map.
     *
     * @throws {Error} Thrown when an unknown component name is provided.
     *
     * @example
     * const numbers = new BoundCombination(null, { start: 1, end: 50, count: 5 });
     * const lottery = new LotteryCombination({ components: { numbers } });
     * lottery.getComponents({ numbers: [1, 2, 3, 4, 5] }).numbers.values;
     */
    public getComponents(
        components: Record<string, CombinationInputOrRank | LotteryCombination> = {}
    ): CombinationComponents {
        return Object.fromEntries(
            Object.entries(components).map(([name, values]) => {
                const source = this._components[name];
                if (!source) {
                    throw new Error(`Component "${name}" does not exist in the combination.`);
                }

                return [name, source.copy({ values })];
            })
        );
    }

    /**
     * Get a component by name.
     *
     * @param name - Component name.
     * @returns Component or `null`.
     *
     * @example
     * const lottery = new LotteryCombination({ components: { numbers: new BoundCombination(null, { start: 1, end: 50, count: 5 }) } });
     * lottery.getComponent('numbers'); // BoundCombination
     * lottery.getComponent('stars'); // null
     */
    public getComponent(name: string): BoundCombination | null {
        return this._components[name] ?? null;
    }

    /**
     * Get values for a specific component.
     *
     * @param name - Component name.
     * @returns Component values or empty array.
     *
     * @example
     * const lottery = new LotteryCombination({ components: { numbers: new BoundCombination([1, 2, 3, 4, 5], { start: 1, end: 50, count: 5 }) } });
     * lottery.getComponentValues('numbers'); // [1, 2, 3, 4, 5]
     */
    public getComponentValues(name: string): CombinationValues {
        return this._components[name]?.values ?? [];
    }

    /**
     * Get winning rank against a candidate winning combination.
     *
     * @param combination - Optional rank/values/combination source.
     * @param components - Optional component overrides.
     * @returns Winning rank or `null` when unmatched.
     * @throws {Error} Thrown when an unknown component name is provided.
     *
     * @example
     * const ranks = createWinningRanks([[[5, 2], 1]]);
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * const stars = new BoundCombination([1, 2], null, 1, 12, 2);
     * const lottery = new LotteryCombination({ winningRanks: ranks, components: { numbers, stars } });
     * lottery.getWinningRank({ combination: [1, 2, 3, 4, 5, 1, 2] }); // 1
     */
    public getWinningRank({ combination = null, components = {} }: LotteryCombinationMatchOptions = {}): number | null {
        const winningCombination = this.intersection({ combination, components });
        const key = toWinningRankKey(Object.values(winningCombination.components).map(component => component.length));
        return this._winningRanks[key] ?? null;
    }

    /**
     * Test equality with another input.
     *
     * @param combination - Optional rank/values/combination source.
     * @param components - Optional component overrides.
     * @returns `true` when fully equal.
     * @throws {Error} Thrown when an unknown component name is provided.
     *
     * @example
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * const a = new LotteryCombination({ components: { numbers } });
     * const b = a.copy();
     * a.equals(b); // true
     */
    public equals({ combination = null, components = {} }: LotteryCombinationMatchOptions = {}): boolean {
        const other = this.getCombination({ combination, components });

        if (other.length !== this.length) {
            return false;
        }

        if (!other.length && !this.length) {
            return true;
        }

        const selfEntries = Object.entries(this.components);
        const otherEntries = Object.entries(other.components);

        return selfEntries.every(([selfName, selfComponent], index) => {
            const [otherName, otherComponent] = otherEntries[index] ?? [];
            if (!otherName || !otherComponent) {
                return false;
            }

            return selfName === otherName && selfComponent.equals(otherComponent);
        });
    }

    /**
     * Test inclusion of another input.
     *
     * @param combination - Optional scalar/rank/values/combination source.
     * @param components - Optional component overrides.
     * @returns `true` when the candidate is included.
     * @throws {Error} Thrown when an unknown component name is provided.
     *
     * @example
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * const lottery = new LotteryCombination({ components: { numbers } });
     * lottery.includes({ combination: 3 }); // true
     */
    public includes({ combination = null, components = {} }: LotteryCombinationIncludesOptions = {}): boolean {
        if (typeof combination === 'number' && Object.keys(components).length === 0) {
            return this.values.includes(combination);
        }

        const other = this.getCombination({
            combination: typeof combination === 'number' ? [combination] : combination,
            components
        });

        if (!other.length) {
            return true;
        }

        return Object.entries(other.components).every(
            ([otherName, otherComponent]) => this._components[otherName]?.includes(otherComponent) ?? false
        );
    }

    /**
     * Test intersection with another input.
     *
     * @param combination - Optional rank/values/combination source.
     * @param components - Optional component overrides.
     * @returns `true` when every provided non-empty component intersects.
     * @throws {Error} Thrown when an unknown component name is provided.
     *
     * @example
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * const lottery = new LotteryCombination({ components: { numbers } });
     * lottery.intersects({ combination: [5] }); // true
     */
    public intersects({ combination = null, components = {} }: LotteryCombinationMatchOptions = {}): boolean {
        const other = this.getCombination({ combination, components });

        if (!other.length || !this.length) {
            return false;
        }

        return Object.entries(other.components)
            .filter(([, otherComponent]) => otherComponent.length > 0)
            .every(([otherName, otherComponent]) => this._components[otherName]?.intersects(otherComponent) ?? false);
    }

    /**
     * Get intersection with another input.
     *
     * @param combination - Optional rank/values/combination source.
     * @param components - Optional component overrides.
     * @returns Intersection lottery combination.
     * @throws {Error} Thrown when an unknown component name is provided.
     *
     * @example
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * const lottery = new LotteryCombination({ components: { numbers } });
     * lottery.intersection({ combination: [4, 5] }).values; // [4, 5]
     */
    public intersection({
        combination = null,
        components = {}
    }: LotteryCombinationMatchOptions = {}): LotteryCombination {
        const other = this.getCombination({ combination, components });

        const intersections: CombinationComponents = Object.fromEntries(
            Object.entries(other.components).map(([otherName, otherComponent]) => {
                const source = this._components[otherName];
                if (!source) {
                    throw new Error(`Component "${otherName}" does not exist in the combination.`);
                }

                return [otherName, source.intersection(otherComponent) as BoundCombination];
            })
        );

        return this.getCombination({ components: intersections });
    }

    /**
     * Compare with another input.
     *
     * @param combination - Optional rank/values/combination source.
     * @param components - Optional component overrides.
     * @returns `-1`, `0`, or `1`.
     * @throws {Error} Thrown when an unknown component name is provided.
     *
     * @example
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * const lottery = new LotteryCombination({ components: { numbers } });
     * lottery.compares({ combination: [1, 2, 3, 4, 6] }); // -1
     */
    public compares({ combination = null, components = {} }: LotteryCombinationMatchOptions = {}): number {
        const other = this.getCombination({ combination, components });

        if (!other.length && !this.length) {
            return 0;
        }

        if (!other.length || !this.length) {
            return this.length < other.length ? -1 : 1;
        }

        for (const [otherName, otherComponent] of Object.entries(other.components)) {
            const selfComponent = this._components[otherName];
            if (!selfComponent) {
                throw new Error(`Component "${otherName}" does not exist in the combination.`);
            }

            const comparison = selfComponent.compares(otherComponent);
            if (comparison !== 0) {
                return comparison;
            }
        }

        return 0;
    }

    /**
     * Compute similarity ratio in `[0, 1]`.
     *
     * @param combination - Optional rank/values/combination source.
     * @param components - Optional component overrides.
     * @returns Similarity ratio.
     * @throws {Error} Thrown when an unknown component name is provided.
     *
     * @example
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * const lottery = new LotteryCombination({ components: { numbers } });
     * lottery.similarity({ combination: [1, 2, 8, 9, 10] }); // 0.4
     */
    public similarity({ combination = null, components = {} }: LotteryCombinationMatchOptions = {}): number {
        const other = this.getCombination({ combination, components });

        if (!other.length && !this.length) {
            return 1;
        }

        if (!other.length || !this.length) {
            return 0;
        }

        const selfEntries = Object.entries(this.components);
        const otherEntries = Object.entries(other.components);
        const strictlyEqual =
            selfEntries.length === otherEntries.length &&
            selfEntries.every(([selfName, selfComponent], index) => {
                const [otherName, otherComponent] = otherEntries[index] ?? [];
                if (!otherName || !otherComponent) {
                    return false;
                }

                return selfName === otherName && selfComponent.equals(otherComponent);
            });

        if (strictlyEqual) {
            return 1;
        }

        const intersectionLength = this.getCombination({
            components: Object.fromEntries(
                Object.entries(other.components).map(([otherName, otherComponent]) => {
                    const source = this._components[otherName];
                    if (!source) {
                        throw new Error(`Component "${otherName}" does not exist in the combination.`);
                    }

                    return [otherName, source.intersection(otherComponent)];
                })
            )
        }).length;

        return intersectionLength / this.length;
    }

    /**
     * Get a value by flattened index.
     *
     * @param index - Zero-based flattened index.
     * @returns Flattened value at `index`.
     *
     * @throws {RangeError} Thrown when index is out of bounds.
     */
    public get(index: number): CombinationNumber {
        const values = this.values;
        if (!Number.isInteger(index) || index < 0 || index >= values.length) {
            throw new RangeError(`Index ${index} is out of bounds.`);
        }

        return values[index] as CombinationNumber;
    }

    /**
     * Check scalar containment in flattened values.
     *
     * @param value - Candidate value.
     * @returns `true` when value is present.
     *
     * @example
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * new LotteryCombination({ components: { numbers } }).has(3); // true
     */
    public has(value: CombinationNumber): boolean {
        return this.values.includes(value);
    }

    /**
     * Get integer hash representation.
     *
     * @returns Rank-based hash.
     *
     * @example
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * new LotteryCombination({ components: { numbers } }).hashCode();
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
     * const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
     * new LotteryCombination({ components: { numbers } }).toRepr();
     */
    public toRepr(): string {
        const params = Object.entries(this._components)
            .map(([name, component]) => `${name}=${component.toRepr()}`)
            .join(', ');
        const prefix = params.length > 0 ? `${params}, ` : '';
        return `LotteryCombination(${prefix}winning_ranks=${JSON.stringify(this._winningRanks)})`;
    }

    public toString(): string {
        return Object.entries(this._components)
            .map(([name, component]) => `${name}: ${component.toString()}`)
            .join(' ');
    }

    public *[Symbol.iterator](): Iterator<CombinationNumber> {
        yield* this.values;
    }

    /**
     * Build a mapped `CombinationComponents` object from a components payload.
     *
     * Subclasses may override this to customize how provided component inputs
     * are turned into `BoundCombination` instances.
     */
    protected buildComponents(
        components: Record<string, CombinationInputOrRank | LotteryCombination>
    ): CombinationComponents {
        const builtComponents: CombinationComponents = {};

        for (const [name, value] of Object.entries(components)) {
            if (value instanceof BoundCombination) {
                builtComponents[name] = value;
                continue;
            }

            if (value instanceof LotteryCombination) {
                builtComponents[name] = new BoundCombination(value.values);
                continue;
            }

            const source = this._components[name];
            if (!source) {
                throw new Error(`Component "${name}" does not exist in the combination.`);
            }

            builtComponents[name] = source.copy({ values: value });
        }

        return builtComponents;
    }

    /**
     * Create a new `LotteryCombination` instance. Made `protected` so subclasses
     * can override instance creation behavior while reusing `buildComponents`.
     */
    protected createCombination(
        components: Record<string, CombinationInputOrRank | LotteryCombination>,
        winningRanks: CombinationWinningRanks | null
    ): this {
        const builtComponents = this.buildComponents(components);
        return new LotteryCombination({ winningRanks, components: builtComponents }) as this;
    }
}

/**
 * Build a winning-ranks map from tuple-like pattern entries.
 *
 * @param entries - Array of `[pattern, rank]` pairs.
 * @returns Encoded winning-rank map.
 *
 * @example
 * const ranks = createWinningRanks([[[5, 2], 1], [[5, 1], 2]]);
 * // => { "5,2": 1, "5,1": 2 }
 */
export const createWinningRanks = (
    entries: Array<[CombinationWinningPattern, CombinationRank]>
): CombinationWinningRanks => Object.fromEntries(entries.map(([pattern, rank]) => [toWinningRankKey(pattern), rank]));
