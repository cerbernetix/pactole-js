import { EuroDreamsCombination } from 'src/combinations/index.ts';
import { EuroDreams } from 'src/lottery/index.ts';
import { Weekday } from 'src/utils/index.ts';
import { describe, expect, it } from 'vitest';

describe('EuroDreams', () => {
    it('sets expected draw days', () => {
        const lottery = new EuroDreams();
        expect(lottery.drawDays.days).toEqual([Weekday.MONDAY, Weekday.THURSDAY]);
    });

    it('sets expected combination factory', () => {
        const lottery = new EuroDreams();
        expect(typeof lottery.combinationFactory).toBe('function');
        const sample = lottery.combinationFactory({});
        expect(sample).toBeInstanceOf(EuroDreamsCombination);
    });

    it('computes last and next draw date correctly', () => {
        const lottery = new EuroDreams();
        const from = new Date(2024, 5, 5); // 2024-06-05
        expect(lottery.getLastDrawDate(from, true)).toEqual(new Date(2024, 5, 3));
        expect(lottery.getNextDrawDate(from, true)).toEqual(new Date(2024, 5, 6));
    });

    it('getCombination uses eurodreams factory', () => {
        const lottery = new EuroDreams();
        const result = lottery.getCombination({ numbers: [1, 2, 3, 4, 5, 6], dream: [2] }) as EuroDreamsCombination;
        expect(result).toBeInstanceOf(EuroDreamsCombination);
        expect(result.numbers.values).toEqual([1, 2, 3, 4, 5, 6]);
        expect(result.dream.values).toEqual([2]);
    });
});
