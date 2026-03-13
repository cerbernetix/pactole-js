import { LotteryCombination, type CombinationFactory, type CombinationInputOrRank } from '../combinations/index.ts';
import { DrawDays, Weekday, type DayInput } from '../utils/days.ts';

/**
 * Options for creating a {@link BaseLottery}.
 */
export interface BaseLotteryOptions {
    /**
     * Draw schedule for the lottery. May be a `DrawDays` instance or any iterable
     * of `DayInput` values (numbers, strings, `Date`, or `Weekday`).
     *
     * @default []
     */
    drawDays?: DrawDays | Iterable<DayInput | Weekday>;

    /**
     * Combination factory used by this lottery. Receives the same options
     * object as {@link LotteryCombination.getCombination}. If `null` or not
     * callable, a default `LotteryCombination` factory is used.
     *
     * @default null
     */
    combinationFactory?: CombinationFactory | null;
}

/**
 * A base class for lottery implementations.
 *
 * The class is essentially a thin wrapper around a draw-day schedule and a
 * combination factory. It provides convenience methods for computing draw dates
 * and delegating combination creation/generation.
 *
 * @param options - Configuration options.
 * @param options.drawDays - Draw schedule for the lottery. May be a `DrawDays` instance
 *   or any iterable of `DayInput` values (numbers, strings, `Date`, or `Weekday`).
 *   Defaults to an empty array.
 * @param options.combinationFactory - Combination factory used by this lottery.
 *   Receives the same options object as {@link LotteryCombination.getCombination}.
 *   If `null` or not callable, a default `LotteryCombination` factory is used.
 *
 * @example
 * ```ts
 * const lottery = new BaseLottery({
 *   drawDays: [Weekday.MONDAY, Weekday.THURSDAY],
 *   combinationFactory: EuroMillionsCombination,
 * });
 *
 * lottery.drawDays; // DrawDays instance
 * lottery.combinationFactory; // factory function
 * lottery.combinationFactory({ numbers: [1, 2, 3], stars: [1] });
 * ```
 */
export class BaseLottery {
    private _drawDays: DrawDays;
    private _combinationFactory: CombinationFactory;

    constructor({ drawDays = [], combinationFactory = null }: BaseLotteryOptions = {}) {
        this._combinationFactory = LotteryCombination.getCombinationFactory(combinationFactory);

        if (drawDays instanceof DrawDays) {
            this._drawDays = drawDays;
        } else {
            this._drawDays = new DrawDays(drawDays as Iterable<DayInput>);
        }
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
        return this._drawDays;
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
        return this._combinationFactory;
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
        return this._drawDays.get_last_draw_date(fromDate, closest);
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
        return this._drawDays.get_next_draw_date(fromDate, closest);
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
        return this._combinationFactory().generate({ n, partitions });
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
        return this._combinationFactory({ components });
    }
}
