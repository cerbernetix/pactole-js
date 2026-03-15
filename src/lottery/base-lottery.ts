import {
    LotteryCombination,
    type CombinationFactory,
    type CombinationInput,
    type CombinationInputOrRank,
    type CombinationRank
} from '../combinations/index.ts';
import { FoundCombination, type DrawRecord } from '../data/models.ts';
import { DrawDays, Weekday, type DayInput } from '../utils/days.ts';

/**
 * Provider contract consumed by {@link BaseLottery}.
 */
export interface LotteryProvider {
    drawDays: DrawDays;
    combinationFactory: CombinationFactory;
    load(force?: boolean): Promise<DrawRecord[]>;
    loadRaw(force?: boolean): Promise<Record<string, unknown>[]>;
}

/**
 * Query options for {@link BaseLottery.find_records}.
 */
export interface FindRecordsOptions {
    combination?: CombinationInput | LotteryCombination | null;
    targetRank?: CombinationRank | null;
    strict?: boolean;
    force?: boolean;
    components?: Record<string, CombinationInputOrRank | LotteryCombination>;
}

/**
 * A base class for lottery implementations.
 *
 * The class is a thin wrapper around a provider that exposes draw-day helpers,
 * combination creation utilities, and cached-history queries.
 *
 * @param provider - Provider instance used by this lottery.
 *
 * @example
 * ```ts
 * const lottery = new BaseLottery(provider);
 *
 * lottery.drawDays; // DrawDays instance
 * lottery.combinationFactory; // factory function
 * lottery.combinationFactory({ numbers: [1, 2, 3], stars: [1] });
 * ```
 */
export class BaseLottery {
    private readonly _provider: LotteryProvider;

    constructor(provider: LotteryProvider) {
        this._provider = provider;
    }

    /**
     * Return the {@link DrawDays} instance associated with this lottery.
     *
     * @returns The {@link DrawDays} instance configured for this lottery.
     *
     * @example
     * ```ts
     * const lottery = new BaseLottery({ drawDays: [Weekday.MONDAY, Weekday.THURSDAY] });
     * lottery.drawDays; // DrawDays instance with Monday and Thursday
     * ```
     */
    public get drawDays(): DrawDays {
        return this._provider.drawDays;
    }

    /**
     * Return the combination factory associated with this lottery.
     *
     * @returns The factory function used to create combinations.
     *
     * @example
     * ```ts
     * const lottery = new BaseLottery({ combinationFactory: EuroMillionsCombination });
     * const factory = lottery.combinationFactory; // EuroMillionsCombination factory function
     * const combination = factory({ numbers: [1, 2, 3], stars: [1] }); // EuroMillionsCombination instance
     * ```
     */
    public get combinationFactory(): CombinationFactory {
        return this._provider.combinationFactory;
    }

    /**
     * Return the date of the last lottery draw according to the configured
     * {@link drawDays}.
     *
     * @param fromDate - Starting reference date. Accepted formats:
     *   - A Unix timestamp in **seconds**.
     *   - An ISO date string (`YYYY-MM-DD`).
     *   - A `Date` object.
     *   - A `Weekday` or other `DayInput` accepted by {@link DrawDays.getLastDrawDate}.
     *   If omitted or `null`, the current date is used.
     * @param closest - Whether to return the closest draw date if `fromDate` is
     *   itself a draw day.
     * @returns A `Date` representing the last draw day on or before `fromDate`.
     * @throws {TypeError} When `fromDate` is not a valid date input.
     * @throws {RangeError} When `fromDate` string cannot be parsed.
     */
    public getLastDrawDate(fromDate: DayInput | Weekday | null = null, closest = true): Date {
        return this._provider.drawDays.get_last_draw_date(fromDate, closest);
    }

    /**
     * Return the date of the next lottery draw according to the configured
     * {@link drawDays}.
     *
     * @param fromDate - Starting reference date. Accepted formats:
     *   - A Unix timestamp in **seconds**.
     *   - An ISO date string (`YYYY-MM-DD`).
     *   - A `Date` object.
     *   - A `Weekday` or other `DayInput` accepted by {@link DrawDays.getNextDrawDate}.
     *   If omitted or `null`, the current date is used.
     * @param closest - Whether to return the closest draw date if `fromDate` is
     *   itself a draw day.
     * @returns A `Date` representing the next draw day on or after `fromDate`.
     * @throws {TypeError} When `fromDate` is not a valid date input.
     * @throws {RangeError} When `fromDate` string cannot be parsed.
     */
    public getNextDrawDate(fromDate: DayInput | Weekday | null = null, closest = true): Date {
        return this._provider.drawDays.get_next_draw_date(fromDate, closest);
    }

    /**
     * Generate a list of random lottery combinations from the configured
     * combination factory.
     *
     * @param options - Options controlling generation.
     * @param options.n - Number of combinations to generate (default `1`).
     * @param options.partitions - Number of partitions to use when ranking/generating.
     *   (default `1`).
     * @returns An array of lottery combinations produced by the factory.
     *
     * @example
     * ```ts
     * const lottery = new BaseLottery({ combinationFactory: EuroMillionsCombination });
     * const combinations = lottery.generate({ n: 2 });
     * ```
     */
    public generate({ n = 1, partitions = 1 }: { n?: number; partitions?: number } = {}): LotteryCombination[] {
        return this._provider.combinationFactory().generate({ n, partitions });
    }

    /**
     * Create a lottery combination from the provided components using the
     * configured factory.
     *
     * @param components - Component values or ranks forwarded to the factory.
     * @returns A lottery combination produced by the factory.
     *
     * @example
     * ```ts
     * const lottery = new BaseLottery({ combinationFactory: EuroMillionsCombination });
     * const ticket = lottery.getCombination({ numbers: [1, 2, 3, 4, 5], stars: [1, 2] });
     * ```
     */
    public getCombination(components: Record<string, CombinationInputOrRank>): LotteryCombination {
        return this._provider.combinationFactory({ components });
    }

    /**
     * Return the total number of cached records.
     */
    public async count(): Promise<number> {
        return (await this._provider.load()).length;
    }

    /**
     * Return raw cached records.
     *
     * @param force - Whether to force a cache refresh first.
     */
    public async dump(force = false): Promise<Record<string, unknown>[]> {
        return await this._provider.loadRaw(force);
    }

    /**
     * Return cached records.
     *
     * @param force - Whether to force a cache refresh first.
     */
    public async get_records(force = false): Promise<DrawRecord[]> {
        return await this._provider.load(force);
    }

    /**
     * Return cached records.
     *
     * @param force - Whether to force a cache refresh first.
     */
    public async getRecords(force = false): Promise<DrawRecord[]> {
        return await this.get_records(force);
    }

    /**
     * Find cached records matching a query combination.
     *
     * @param options - Query options.
     */
    public async find_records({
        combination = null,
        targetRank = null,
        strict = false,
        force = false,
        components = {}
    }: FindRecordsOptions = {}): Promise<FoundCombination[]> {
        const query = this._provider.combinationFactory({ combination, components });
        const normalizedTargetRank = targetRank ?? (!strict ? query.minWinningRank : null);

        if (normalizedTargetRank !== null) {
            return await this._findRecordsByWinningRank(query, normalizedTargetRank, strict, force);
        }

        return await this._findRecordsByCombination(query, force);
    }

    /**
     * Find cached records matching a query combination.
     *
     * @param options - Query options.
     */
    public async findRecords(options: FindRecordsOptions = {}): Promise<FoundCombination[]> {
        return await this.find_records(options);
    }

    private async _findRecordsByCombination(
        combination: LotteryCombination,
        force = false
    ): Promise<FoundCombination[]> {
        const matches: FoundCombination[] = [];

        for (const record of await this._provider.load(force)) {
            if (record.combination.includes({ combination })) {
                const winningRank = record.combination.getWinningRank({ combination }) as CombinationRank;

                matches.push(
                    new FoundCombination({
                        record,
                        rank: winningRank
                    })
                );
            }
        }

        return matches;
    }

    private async _findRecordsByWinningRank(
        combination: LotteryCombination,
        targetRank: CombinationRank,
        strict = false,
        force = false
    ): Promise<FoundCombination[]> {
        const matches: FoundCombination[] = [];

        for (const record of await this._provider.load(force)) {
            const winningRank = record.combination.getWinningRank({ combination });
            const isMatch = strict ? winningRank === targetRank : winningRank !== null && winningRank >= targetRank;

            if (isMatch) {
                matches.push(
                    new FoundCombination({
                        record,
                        rank: winningRank as CombinationRank
                    })
                );
            }
        }

        return matches;
    }
}
