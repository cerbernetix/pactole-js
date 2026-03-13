import { EuroMillionsCombination } from 'src/combinations';
import { EuroMillions } from 'src/lottery';
import { Weekday } from 'src/utils/days';
import { describe, expect, it } from 'vitest';

describe('EuroMillions', () => {
    it('sets expected draw days', () => {
        const lottery = new EuroMillions();
        expect(lottery.drawDays.days).toEqual([Weekday.TUESDAY, Weekday.FRIDAY]);
    });

    it('sets expected combination factory', () => {
        const lottery = new EuroMillions();
        // factory is wrapped - should produce instances identical to class
        expect(typeof lottery.combinationFactory).toBe('function');
        const sample = lottery.combinationFactory({});
        expect(sample).toBeInstanceOf(EuroMillionsCombination);
    });

    it('computes last and next draw date correctly', () => {
        const lottery = new EuroMillions();
        const from = new Date(2024, 5, 5); // 2024-06-05
        expect(lottery.getLastDrawDate(from, true)).toEqual(new Date(2024, 5, 4));
        expect(lottery.getNextDrawDate(from, true)).toEqual(new Date(2024, 5, 7));
    });

    it('getCombination uses euromillions factory', () => {
        const lottery = new EuroMillions();
        const result = lottery.getCombination({ numbers: [1, 2, 3, 4, 5], stars: [1, 2] }) as EuroMillionsCombination;
        expect(result).toBeInstanceOf(EuroMillionsCombination);
        expect(result.numbers.values).toEqual([1, 2, 3, 4, 5]);
        expect(result.stars.values).toEqual([1, 2]);
    });
});
