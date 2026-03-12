/**
 * A union describing all acceptable inputs for the various weekday and date
 * helper methods.
 *
 * - **number**: interpreted as a weekday index (0 = Monday) if integral; a
 *   non‑integer value is treated as a Unix timestamp in **seconds**.
 * - **string**: either a day name (`"monday"` etc.) or an ISO date
 *   (`"YYYY-MM-DD"`).  Invalid strings produce a `RangeError` during parsing.
 * - **Date**: a native JS `Date` object.
 *
 * `Weekday` instances themselves are also accepted by most helpers, but are
 * not included in this alias to avoid a circular type definition.
 */
export type DayInput = number | string | Date;

const WEEK = 7;
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const NAMES_TO_WEEKDAY: Record<string, number> = DAY_NAMES.reduce(
    (acc, name, i) => {
        acc[name] = i;
        return acc;
    },
    {} as Record<string, number>
);

/**
 * Enumeration for the days of the week.
 *
 * A `Weekday` behaves like an enumeration of the seven weekdays.  Calling
 * implementation: calling the constructor or `Weekday.from()` with a value
 * returns one of the predefined singletons (e.g. `Weekday.MONDAY`).  The
 * class provides numerous helpers for navigating and comparing weekdays,
 * including methods that return the next/previous occurrence, compute the
 * distance between days, and translate between `Date` objects and weekday
 * values.
 *
 * Input values accepted everywhere include:
 * - an integer 0–6 (or any integer, will be taken modulo 7)
 * - a floating-point number interpreted as a Unix timestamp in seconds
 * - a string containing either a day name (case-insensitive) or an ISO date
 *   (`YYYY-MM-DD`)
 * - a `Date` object
 * - another `Weekday` instance
 *
 * Invalid or unrecognizable inputs will cause the factory methods to throw a
 * `TypeError` or `RangeError`.
 *
 * All public operations are synchronous and side‑effect free.
 *
 * Examples:
 * ```ts
 * Weekday.from(0) === Weekday.MONDAY;
 * Weekday.from("2024-01-01"); // Monday
 * Weekday.from(new Date(2024, 0, 1)); // Monday
 * Weekday.MONDAY.next(); // Tuesday
 * Weekday.FRIDAY.next([Weekday.MONDAY, Weekday.WEDNESDAY]); // Monday
 *```
 */
export class Weekday {
    /**
     * The internal value of the weekday, normalized to the range 0..6.  This is
     * used for all internal calculations and comparisons.
     */
    readonly value: number;

    private constructor(value: number) {
        // always normalize to 0..6
        this.value = ((value % WEEK) + WEEK) % WEEK;
    }

    // static instances – keep them in order so we can index easily
    static readonly MONDAY = new Weekday(0);
    static readonly TUESDAY = new Weekday(1);
    static readonly WEDNESDAY = new Weekday(2);
    static readonly THURSDAY = new Weekday(3);
    static readonly FRIDAY = new Weekday(4);
    static readonly SATURDAY = new Weekday(5);
    static readonly SUNDAY = new Weekday(6);

    private static readonly _VALUES: Weekday[] = [
        Weekday.MONDAY,
        Weekday.TUESDAY,
        Weekday.WEDNESDAY,
        Weekday.THURSDAY,
        Weekday.FRIDAY,
        Weekday.SATURDAY,
        Weekday.SUNDAY
    ];

    /**
     * Internal helper that accepts all of the various input shapes used by
     * the public API.
     *
     * This method is private; consumers should call {@link Weekday.from} or
     * {@link Weekday.get_day} instead.
     *
     * @param value - input value to convert into a `Weekday`; may be `null`
     *                or `undefined`, in which case the current local day is used.
     * @returns a canonical `Weekday` instance.
     * @throws TypeError if the argument cannot be understood as a weekday.
     */
    private static _from(value?: DayInput | Weekday | null): Weekday {
        if (value === null || value === undefined) {
            return Weekday.today();
        }

        if (value instanceof Weekday) {
            return value;
        }

        if (typeof value === 'number') {
            // non‑integer numbers are treated as Unix timestamps (seconds since
            // epoch); integers are interpreted as weekday indices.
            if (!Number.isInteger(value)) {
                const date = new Date(value * 1000);
                return Weekday._from(date);
            }
            const idx = ((value % WEEK) + WEEK) % WEEK;
            return Weekday._VALUES[idx];
        }

        if (typeof value === 'string') {
            const dayLower = value.trim().toLowerCase();
            if (dayLower in NAMES_TO_WEEKDAY) {
                return Weekday._VALUES[NAMES_TO_WEEKDAY[dayLower]];
            }
            // try parsing as ISO date
            const date = new Date(dayLower);
            if (isNaN(date.getTime())) {
                throw new RangeError(`Invalid day or date string: ${value}`);
            }
            return Weekday._from(date);
        }

        if (value instanceof Date) {
            // JS: Sunday=0, Monday=1 ... Saturday=6
            // desired mapping: Monday=0 ... Sunday=6
            const jsDay = value.getDay();
            const idx = jsDay === 0 ? 6 : jsDay - 1;
            return Weekday._VALUES[idx];
        }

        throw new TypeError('Weekday input must be a number, string, Date or Weekday instance');
    }

    /**
     * Create a `Weekday` instance from a variety of inputs.
     *
     * A static factory wrapper that provides a more descriptive name than a
     * direct constructor call and centralizes conversion logic.
     *
     * @param value - optional weekday input (see class description); `undefined`
     *                or `null` yields the current day.
     * @returns the corresponding singleton `Weekday`.
     * @throws TypeError if `value` is not convertible.
     *
     * @example
     * ```ts
     * Weekday.from("monday");
     * Weekday.from(5); // Saturday
     * ```
     */
    static from(value?: DayInput | Weekday | null): Weekday {
        return Weekday._from(value);
    }

    /**
     * Identical to {@link from}; included as an alternate name for clarity,
     * matching other public APIs.
     *
     * @param value - see {@link from}
     * @returns the corresponding `Weekday`.
     */
    static get_day(value?: DayInput | Weekday | null): Weekday {
        return Weekday._from(value);
    }

    /**
     * Normalize a `DayInput` into a native `Date` object.
     *
     * The argument may be a timestamp (number), an ISO date string, or a
     * `Date` instance; `null`/`undefined` returns `new Date()` (today).  This
     * helper is shared by the weekday/date methods below.
     *
     * @param from - input value to coerce.
     * @returns the corresponding `Date`.
     * @throws TypeError if the argument is of an unsupported type.
     * @throws RangeError if a string is not a valid ISO date.
     *
     * @example
     * ```ts
     * Weekday.get_date("2024-01-01");
     * Weekday.get_date(1672531200); // seconds since epoch
     * ```
     */
    static get_date(from?: DayInput | null): Date {
        if (from === null || from === undefined) {
            return new Date();
        }

        if (typeof from === 'number') {
            // treat as seconds since epoch
            return new Date(from * 1000);
        }

        if (typeof from === 'string') {
            const d = new Date(from);
            if (isNaN(d.getTime())) {
                throw new RangeError(`Invalid ISO date string: ${from}`);
            }
            return d;
        }

        if (from instanceof Date) {
            return from;
        }

        throw new TypeError('The date must be a date object, a string in ISO format, or a timestamp.');
    }

    /**
     * Return the current weekday using the system clock.
     *
     * @returns the `Weekday` corresponding to `new Date().getDay()`.
     */
    static today(): Weekday {
        const now = new Date();
        return Weekday._from(now);
    }

    /**
     * Helper used by several instance methods to normalize an argument.
     */
    private static _normDays(days: DayInput | Weekday | Iterable<DayInput | Weekday> | null | undefined): Weekday[] {
        if (days === null || days === undefined) {
            return [];
        }
        if (typeof days !== 'object' || days instanceof Date || days instanceof Weekday) {
            return [Weekday._from(days as DayInput | Weekday)];
        }
        // iterable (array or other)
        const out: Weekday[] = [];
        for (const d of days as Iterable<DayInput | Weekday>) {
            out.push(Weekday._from(d));
        }
        return out;
    }

    /**
     * Get the next weekday after `this`, optionally restricted to a set of days.
     *
     * If `days` is `null` or `undefined`, simply returns the following day of
     * the week (e.g. Monday → Tuesday).  When a target or collection of targets
     * is provided, the method finds the next occurrence among them, wrapping
     * back to the first candidate if necessary.
     *
     * @param days - target day(s) as a `DayInput` or iterable thereof.
     * @returns the `Weekday` representing the next day.
     * @throws TypeError when an element of `days` cannot be converted.
     *
     * @example
     * ```ts
     * Weekday.WEDNESDAY.next(); // Thursday
     * Weekday.WEDNESDAY.next(Weekday.MONDAY); // Monday (wraps)
     * Weekday.FRIDAY.next([1, 3]); // Tuesday (1=Tuesday,3=Thursday)
     * ```
     */
    next(days: DayInput | Weekday | Iterable<DayInput | Weekday> | null = null): Weekday {
        if (days === null) {
            const nextValue = (this.value + 1) % WEEK;
            return Weekday._VALUES[nextValue];
        }

        const list = Weekday._normDays(days);
        const sorted = list.map(w => w.value).sort((a, b) => a - b);
        for (const val of sorted) {
            if (val > this.value) {
                return Weekday._VALUES[val];
            }
        }
        return Weekday._VALUES[sorted[0]];
    }

    /**
     * Get the previous weekday before `this`, optionally restricted to targets.
     *
     * Behavior mirrors {@link next} but searches backward; wrapping occurs
     * when no earlier candidate exists.
     *
     * @param days - single or multiple `DayInput` targets.
     * @returns the previous matching `Weekday`.
     * @throws TypeError when an element of `days` cannot be converted.
     */
    previous(days: DayInput | Weekday | Iterable<DayInput | Weekday> | null = null): Weekday {
        if (days === null) {
            const prevValue = (this.value - 1 + WEEK) % WEEK;
            return Weekday._VALUES[prevValue];
        }

        const list = Weekday._normDays(days);
        const sorted = list.map(w => w.value).sort((a, b) => a - b);
        for (let i = sorted.length - 1; i >= 0; --i) {
            const val = sorted[i];
            if (val < this.value) {
                return Weekday._VALUES[val];
            }
        }
        return Weekday._VALUES[sorted[sorted.length - 1]];
    }

    /**
     * Number of days until the next occurrence of a given weekday.
     *
     * If `day` is omitted the current weekday is used.  The returned value is in
     * the range `1..7` (returning 7 if the target is the same as `this`).
     *
     * @param day - target weekday (see class description).
     * @returns days until next target.
     *
     * @example
     * ```ts
     * Weekday.WEDNESDAY.until(Weekday.FRIDAY); // 2
     * Weekday.MONDAY.until(Weekday.MONDAY); // 7
     * ```
     */
    until(day: DayInput | Weekday | null = null): number {
        const target = Weekday._from(day);
        return ((target.value + WEEK - this.value - 1) % WEEK) + 1;
    }

    /**
     * Number of days since the previous occurrence of a given weekday.
     *
     * Works like {@link until} but counts backward; result spans `1..7`.
     *
     * @param day - target weekday.
     * @returns days since last target.
     *
     * @example
     * ```ts
     * Weekday.WEDNESDAY.since(Weekday.MONDAY); // 2
     * Weekday.MONDAY.since(Weekday.MONDAY); // 7
     * ```
     */
    since(day: DayInput | Weekday | null = null): number {
        const target = Weekday._from(day);
        return ((WEEK - target.value + this.value - 1) % WEEK) + 1;
    }

    /**
     * Days to the closest occurrence of `day`, positive for future, negative
     * for past.
     *
     * If `day` equals `this` returns `0`.  This method chooses the shorter of
     * the forward (`until`) and backward (`since`) distances; when equal the
     * forward distance is returned.
     *
     * @param day - target weekday.
     * @returns signed distance in days.
     *
     * @example
     * ```ts
     * Weekday.MONDAY.closest(Weekday.FRIDAY); // -3 (closest is previous)
     * Weekday.MONDAY.closest(Weekday.SUNDAY); // 6
     * ```
     */
    closest(day: DayInput | Weekday | null = null): number {
        const target = Weekday._from(day);
        if (this === target) {
            return 0;
        }
        const until = this.until(target);
        const since = this.since(target);
        return until <= since ? until : -since;
    }

    /**
     * Signed days to the furthest occurrence of `day` from `this`.
     *
     * The complement of {@link closest}; returns `7` if `day === this`.
     *
     * @param day - target weekday.
     * @returns signed distance in days.
     *
     * @example
     * ```ts
     * Weekday.MONDAY.furthest(Weekday.FRIDAY); // 4 (Friday in future)
     * Weekday.MONDAY.furthest(Weekday.MONDAY); // 7
     * ```
     */
    furthest(day: DayInput | Weekday | null = null): number {
        const target = Weekday._from(day);
        if (this === target) {
            return WEEK;
        }
        const until = this.until(target);
        const since = this.since(target);
        return until > since ? until : -since;
    }

    /**
     * Calculate the next calendar date falling on this weekday.
     *
     * @param from_date - starting point (see {@link Weekday.get_date}); defaults
     *                    to today when omitted.
     * @param closest - if true, return `from_date` when it already matches.
     * @returns a `Date` for the next matching weekday.
     * @throws TypeError/RangeError from {@link Weekday.get_date} on invalid input.
     *
     * @example
     * ```ts
     * Weekday.FRIDAY.next_date("2024-01-03"); // 2024-01-05
     * Weekday.WEDNESDAY.next_date(new Date(2024, 0, 3), true); // same day
     * ```
     */
    next_date(from_date: DayInput | null = null, closest = false): Date {
        const d = Weekday.get_date(from_date as DayInput | null);
        const weekday = Weekday._from(d);
        if (closest && weekday === this) {
            return d;
        }
        const delta = weekday.until(this);
        const result = new Date(d);
        result.setDate(result.getDate() + delta);
        return result;
    }

    /**
     * Calendar date of the previous occurrence of this weekday.
     *
     * Parameters mirror {@link next_date}.
     *
     * @example
     * ```ts
     * Weekday.MONDAY.previous_date("2024-01-03"); // 2024-01-01
     * Weekday.WEDNESDAY.previous_date(new Date(2024,0,3), true); // same day
     * ```
     */
    previous_date(from_date: DayInput | null = null, closest = false): Date {
        const d = Weekday.get_date(from_date as DayInput | null);
        const weekday = Weekday._from(d);
        if (closest && weekday === this) {
            return d;
        }
        const delta = weekday.since(this);
        const result = new Date(d);
        result.setDate(result.getDate() - delta);
        return result;
    }

    /**
     * Closest calendar date with this weekday (past or future).
     *
     * @param from_date - reference date; defaults to today.
     *
     * @example
     * ```ts
     * Weekday.MONDAY.closest_date("2024-01-03"); // 2024-01-01
     * ```
     */
    closest_date(from_date: DayInput | null = null): Date {
        const d = Weekday.get_date(from_date as DayInput | null);
        const weekday = Weekday._from(d);
        if (weekday === this) {
            return d;
        }
        const delta = weekday.closest(this);
        const result = new Date(d);
        result.setDate(result.getDate() + delta);
        return result;
    }

    /**
     * Furthest calendar date with this weekday from `from_date`.
     *
     * When `from_date` already matches the weekday, the result is exactly one
     * week later.
     *
     * @example
     * ```ts
     * Weekday.MONDAY.furthest_date("2024-01-01"); // 2024-01-08
     * ```
     */
    furthest_date(from_date: DayInput | null = null): Date {
        const d = Weekday.get_date(from_date as DayInput | null);
        const weekday = Weekday._from(d);
        if (weekday === this) {
            const result = new Date(d);
            result.setDate(result.getDate() + WEEK);
            return result;
        }
        const delta = weekday.furthest(this);
        const result = new Date(d);
        result.setDate(result.getDate() + delta);
        return result;
    }

    /**
     * Return the uppercase name of the weekday (e.g. "MONDAY").
     *
     * This is primarily useful for debugging and logging.
     */
    toString(): string {
        return DAY_NAMES[this.value].toUpperCase();
    }
}

/**
 * Helper for lotteries to compute last/next draw dates given a set of weekday
 * draw days.
 *
 * The constructor accepts any iterable of weekday values; methods take the
 * same loose inputs as `Weekday` (including `Date`/timestamp) and return
 * `Date` objects.  However, supplying a `Weekday` instance as the
 * `from_date` parameter is not allowed and will raise a `TypeError`.
 *
 * @param days - iterable of weekday inputs defining the draw schedule.
 *
 * @example
 * ```ts
 * const draws = new DrawDays([Weekday.MONDAY, Weekday.THURSDAY]);
 * draws.get_last_draw_date(new Date(2024, 5, 5)); // 2024-06-03
 * draws.get_next_draw_date("2024-06-05");        // 2024-06-06
 * ```
 */
export class DrawDays {
    private readonly _days: Weekday[];

    constructor(days: Iterable<DayInput | Weekday>) {
        this._days = Array.from(days, d => Weekday.get_day(d));
    }

    /**
     * Read-only array of the configured draw weekdays.
     */
    get days(): readonly Weekday[] {
        return [...this._days];
    }

    /**
     * Return the most recent draw date on or before `from_date`.
     *
     * The input is coerced via {@link Weekday.get_date}, so the same variety of
     * strings, timestamps and `Date` objects is accepted. Type/format errors
     * will propagate from that helper.
     *
     * @param from_date - reference moment; when omitted uses today.
     * @param closest - if `true` and `from_date` itself is a draw day, it is
     *                  returned; otherwise the previous draw day is used.
     * @returns a `Date` object occurring on one of the configured draw days.
     * @throws TypeError/RangeError from {@link Weekday.get_date} on invalid
     *         `from_date` input.  Passing a `Weekday` instance is *not*
     *         considered a valid date and will therefore throw.
     *
     * @example
     * ```ts
     * const dd = new DrawDays([Weekday.MONDAY, Weekday.THURSDAY]);
     * dd.get_last_draw_date("2024-06-05"); // 2024-06-03
     * dd.get_last_draw_date(new Date(2024, 5, 6)); // same day if closest
     * ```
     */
    get_last_draw_date(from_date: DayInput | Weekday | null = null, closest = true): Date {
        let day = Weekday.get_day(from_date as DayInput | Weekday | null);
        if (!closest || !this._days.includes(day)) {
            day = day.previous(this._days);
        }
        return day.previous_date(from_date as DayInput | null, closest);
    }

    /**
     * Return the next draw date on or after `from_date`.
     *
     * Parameters mirror {@link get_last_draw_date}.
     *
     * @throws TypeError/RangeError from {@link Weekday.get_date} on invalid
     *         `from_date` input.  Passing a `Weekday` instance is *not*
     *         considered a valid date and will therefore throw.
     *
     * @example
     * ```ts
     * const dd = new DrawDays([Weekday.MONDAY, Weekday.THURSDAY]);
     * dd.get_next_draw_date("2024-06-05"); // 2024-06-06
     * ```
     */
    get_next_draw_date(from_date: DayInput | Weekday | null = null, closest = true): Date {
        let day = Weekday.get_day(from_date as DayInput | Weekday | null);
        if (!closest || !this._days.includes(day)) {
            day = day.next(this._days);
        }
        return day.next_date(from_date as DayInput | null, closest);
    }
}
