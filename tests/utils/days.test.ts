import { Weekday, type DayInput } from 'src/utils/days';
import { afterEach, describe, expect, it, vi } from 'vitest';

// helpers for timestamps (seconds since epoch).  We add a tiny
// fractional component so the value is not an integer; this allows the
// implementation to treat it as a timestamp instead of a weekday index.
function ts(year: number, month: number, day: number): number {
    // JS months are zero-indexed
    return Date.UTC(year, month - 1, day) / 1000 + 0.001;
}

describe('Weekday', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates from today when passed null/undefined', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2024, 0, 1)); // monday
        expect(Weekday.from(null)).toBe(Weekday.MONDAY);
        expect(Weekday.from(undefined)).toBe(Weekday.MONDAY);
    });

    it('rejects invalid types', () => {
        // converting an object should throw; use `unknown` to avoid an `any` lint error
        expect(() => Weekday.from({} as unknown as DayInput)).toThrow();
    });

    it('interprets integers as weekday indices modulo 7', () => {
        expect(Weekday.from(7)).toBe(Weekday.MONDAY);
        expect(Weekday.from(0)).toBe(Weekday.MONDAY);
        expect(Weekday.from(1)).toBe(Weekday.TUESDAY);
        expect(Weekday.from(2)).toBe(Weekday.WEDNESDAY);
        expect(Weekday.from(3)).toBe(Weekday.THURSDAY);
        expect(Weekday.from(4)).toBe(Weekday.FRIDAY);
        expect(Weekday.from(5)).toBe(Weekday.SATURDAY);
        expect(Weekday.from(6)).toBe(Weekday.SUNDAY);
    });

    it('accepts Weekday instances', () => {
        expect(Weekday.from(Weekday.MONDAY)).toBe(Weekday.MONDAY);
        expect(Weekday.from(Weekday.TUESDAY)).toBe(Weekday.TUESDAY);
        expect(Weekday.from(Weekday.WEDNESDAY)).toBe(Weekday.WEDNESDAY);
        expect(Weekday.from(Weekday.THURSDAY)).toBe(Weekday.THURSDAY);
        expect(Weekday.from(Weekday.FRIDAY)).toBe(Weekday.FRIDAY);
        expect(Weekday.from(Weekday.SATURDAY)).toBe(Weekday.SATURDAY);
        expect(Weekday.from(Weekday.SUNDAY)).toBe(Weekday.SUNDAY);
    });

    it('parses timestamps expressed as non-integer numbers', () => {
        expect(Weekday.from(ts(2024, 1, 1))).toBe(Weekday.MONDAY);
        expect(Weekday.from(ts(2024, 1, 2))).toBe(Weekday.TUESDAY);
        expect(Weekday.from(ts(2024, 1, 3))).toBe(Weekday.WEDNESDAY);
        expect(Weekday.from(ts(2024, 1, 4))).toBe(Weekday.THURSDAY);
        expect(Weekday.from(ts(2024, 1, 5))).toBe(Weekday.FRIDAY);
        expect(Weekday.from(ts(2024, 1, 6))).toBe(Weekday.SATURDAY);
        expect(Weekday.from(ts(2024, 1, 7))).toBe(Weekday.SUNDAY);
    });

    it('accepts Date objects', () => {
        expect(Weekday.from(new Date(2024, 0, 1))).toBe(Weekday.MONDAY);
        expect(Weekday.from(new Date(2024, 0, 2))).toBe(Weekday.TUESDAY);
        expect(Weekday.from(new Date(2024, 0, 3))).toBe(Weekday.WEDNESDAY);
        expect(Weekday.from(new Date(2024, 0, 4))).toBe(Weekday.THURSDAY);
        expect(Weekday.from(new Date(2024, 0, 5))).toBe(Weekday.FRIDAY);
        expect(Weekday.from(new Date(2024, 0, 6))).toBe(Weekday.SATURDAY);
        expect(Weekday.from(new Date(2024, 0, 7))).toBe(Weekday.SUNDAY);
    });

    it('parses ISO date strings', () => {
        expect(Weekday.from('2024-01-01')).toBe(Weekday.MONDAY);
        expect(Weekday.from('2024-01-02')).toBe(Weekday.TUESDAY);
        expect(Weekday.from('2024-01-03')).toBe(Weekday.WEDNESDAY);
        expect(Weekday.from('2024-01-04')).toBe(Weekday.THURSDAY);
        expect(Weekday.from('2024-01-05')).toBe(Weekday.FRIDAY);
        expect(Weekday.from('2024-01-06')).toBe(Weekday.SATURDAY);
        expect(Weekday.from('2024-01-07')).toBe(Weekday.SUNDAY);
    });

    it('parses day names (case/space insensitive)', () => {
        expect(Weekday.from('monday')).toBe(Weekday.MONDAY);
        expect(Weekday.from('  TuEsDaY ')).toBe(Weekday.TUESDAY);
        expect(() => Weekday.from('notaday')).toThrow();
    });

    it('next()/previous() basic behaviour', () => {
        expect(Weekday.MONDAY.next()).toBe(Weekday.TUESDAY);
        expect(Weekday.TUESDAY.next()).toBe(Weekday.WEDNESDAY);
        expect(Weekday.WEDNESDAY.next()).toBe(Weekday.THURSDAY);
        expect(Weekday.THURSDAY.next()).toBe(Weekday.FRIDAY);
        expect(Weekday.FRIDAY.next()).toBe(Weekday.SATURDAY);
        expect(Weekday.SATURDAY.next()).toBe(Weekday.SUNDAY);
        expect(Weekday.SUNDAY.next()).toBe(Weekday.MONDAY);

        expect(Weekday.MONDAY.previous()).toBe(Weekday.SUNDAY);
        expect(Weekday.TUESDAY.previous()).toBe(Weekday.MONDAY);
        expect(Weekday.WEDNESDAY.previous()).toBe(Weekday.TUESDAY);
        expect(Weekday.THURSDAY.previous()).toBe(Weekday.WEDNESDAY);
        expect(Weekday.FRIDAY.previous()).toBe(Weekday.THURSDAY);
        expect(Weekday.SATURDAY.previous()).toBe(Weekday.FRIDAY);
        expect(Weekday.SUNDAY.previous()).toBe(Weekday.SATURDAY);
    });

    it('next/previous wrap when all targets are on the opposite side', () => {
        // next with only earlier days should wrap to the first element
        expect(Weekday.WEDNESDAY.next([Weekday.MONDAY])).toBe(Weekday.MONDAY);
        // previous with only later days should return the last element
        expect(Weekday.TUESDAY.previous([Weekday.WEDNESDAY])).toBe(Weekday.WEDNESDAY);
    });

    it('toString returns uppercase name', () => {
        expect(Weekday.MONDAY.toString()).toBe('MONDAY');
        expect(Weekday.TUESDAY.toString()).toBe('TUESDAY');
        expect(Weekday.WEDNESDAY.toString()).toBe('WEDNESDAY');
        expect(Weekday.THURSDAY.toString()).toBe('THURSDAY');
        expect(Weekday.FRIDAY.toString()).toBe('FRIDAY');
        expect(Weekday.SATURDAY.toString()).toBe('SATURDAY');
        expect(Weekday.SUNDAY.toString()).toBe('SUNDAY');
    });

    it('normDays handles null/undefined when called directly', () => {
        // access private helper; cast via any so we can call it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fn = (Weekday as any)._normDays;
        expect(fn(null)).toEqual([]);
        expect(fn(undefined)).toEqual([]);
    });

    it('next()/previous() accept Date objects in the target list', () => {
        const mondayDate = new Date(2024, 0, 1);
        expect(Weekday.WEDNESDAY.next([mondayDate])).toBe(Weekday.MONDAY);
        expect(Weekday.TUESDAY.previous([mondayDate])).toBe(Weekday.MONDAY);
    });

    it('next()/previous() with targets', () => {
        expect(Weekday.MONDAY.next(Weekday.MONDAY)).toBe(Weekday.MONDAY);
        expect(Weekday.FRIDAY.next(Weekday.MONDAY)).toBe(Weekday.MONDAY);
        expect(Weekday.MONDAY.next([Weekday.TUESDAY, Weekday.FRIDAY])).toBe(Weekday.TUESDAY);
        expect(Weekday.MONDAY.previous([Weekday.TUESDAY, Weekday.FRIDAY])).toBe(Weekday.FRIDAY);
    });

    it('until/since/closest/furthest calculations', () => {
        expect(Weekday.MONDAY.until(Weekday.WEDNESDAY)).toBe(2);
        expect(Weekday.SUNDAY.until(Weekday.SUNDAY)).toBe(7);
        expect(Weekday.WEDNESDAY.since(Weekday.MONDAY)).toBe(2);
        // positive closest path (until <= since)
        expect(Weekday.MONDAY.closest(Weekday.WEDNESDAY)).toBe(2);
        // the closest Friday from Monday is three days backward, hence -3
        expect(Weekday.MONDAY.closest(Weekday.FRIDAY)).toBe(-3);
        expect(Weekday.MONDAY.closest(Weekday.MONDAY)).toBe(0);
        expect(Weekday.MONDAY.furthest(Weekday.MONDAY)).toBe(7);
        // negative furthest path (until <= since)
        expect(Weekday.MONDAY.furthest(Weekday.WEDNESDAY)).toBe(-5);
        expect(Weekday.MONDAY.furthest(Weekday.FRIDAY)).toBe(4);
    });

    it('date helpers relative to explicit dates', () => {
        const base = new Date(2024, 0, 3); // Wednesday
        expect(Weekday.MONDAY.next_date(base)).toEqual(new Date(2024, 0, 8));
        expect(Weekday.MONDAY.previous_date(base)).toEqual(new Date(2024, 0, 1));
        expect(Weekday.MONDAY.closest_date(base)).toEqual(new Date(2024, 0, 1));
        expect(Weekday.MONDAY.furthest_date(base)).toEqual(new Date(2024, 0, 8));

        expect(Weekday.WEDNESDAY.next_date(base, true)).toEqual(base);
        expect(Weekday.WEDNESDAY.previous_date(base, true)).toEqual(base);
        expect(Weekday.WEDNESDAY.closest_date(base)).toEqual(base);
        expect(Weekday.WEDNESDAY.furthest_date(base)).toEqual(new Date(2024, 0, 10));
    });

    it('date helpers with timestamps/strings', () => {
        const t = ts(2024, 1, 3);
        const nxt = Weekday.MONDAY.next_date(t);
        // ignore time component when comparing
        expect(nxt.toISOString().slice(0, 10)).toBe('2024-01-08');
        const prev = Weekday.MONDAY.previous_date('2024-01-03');
        expect(prev.toISOString().slice(0, 10)).toBe('2024-01-01');
    });

    it('today/get_day/get_date utilities propagate correctly', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2024, 0, 1));
        expect(Weekday.today()).toBe(Weekday.MONDAY);
        expect(Weekday.get_day()).toBe(Weekday.MONDAY);
        expect(Weekday.get_date()).toEqual(new Date(2024, 0, 1));
    });

    it('get_day/get_date throw for invalid inputs', () => {
        // @ts-expect-error testing invalid input types
        expect(() => Weekday.get_day({})).toThrow();
        // @ts-expect-error testing invalid input types
        expect(() => Weekday.get_date({})).toThrow(TypeError);
        expect(() => Weekday.get_date('not-a-date')).toThrow(RangeError);
    });
});
