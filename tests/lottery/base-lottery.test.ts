import { BoundCombination, LotteryCombination, type CombinationFactory } from 'src/combinations/index.ts';
import { BaseLottery } from 'src/lottery/index.ts';
import { DrawDays, Weekday } from 'src/utils/index.ts';
import { describe, expect, it } from 'vitest';

function buildCombinationFactory(): [CombinationFactory, LotteryCombination] {
    const template = new LotteryCombination({
        components: { main: new BoundCombination(null, { start: 1, end: 10, count: 2 }) },
        winningRanks: { '2': 1, '1': 2 }
    });
    return [template.getCombination.bind(template), template];
}

describe('BaseLottery', () => {
    it('initializes default factory when not callable', () => {
        const lottery = new BaseLottery();

        const result = lottery.getCombination({});

        expect(typeof lottery.combinationFactory).toBe('function');
        expect(lottery.drawDays.days).toEqual([]);
        expect(result).toBeInstanceOf(LotteryCombination);
    });

    it('exposes provider draw days', () => {
        const drawDays = new DrawDays([Weekday.MONDAY, Weekday.THURSDAY]);
        const [factory] = buildCombinationFactory();
        const lottery = new BaseLottery({ drawDays, combinationFactory: factory });

        expect(lottery.drawDays).toBe(drawDays);
    });

    it('exposes provider combination factory', () => {
        const drawDays = new DrawDays([Weekday.MONDAY]);
        const [factory] = buildCombinationFactory();
        const lottery = new BaseLottery({ drawDays, combinationFactory: factory });

        expect(lottery.combinationFactory).toBe(factory);
    });

    it('delegates last draw date to draw days', () => {
        const drawDays = new DrawDays([Weekday.TUESDAY, Weekday.FRIDAY]);
        const [factory] = buildCombinationFactory();
        const lottery = new BaseLottery({ drawDays, combinationFactory: factory });

        const result = lottery.getLastDrawDate(new Date(2024, 5, 5), true);
        expect(result).toEqual(new Date(2024, 5, 4));
    });

    it('delegates next draw date to draw days', () => {
        const drawDays = new DrawDays([Weekday.TUESDAY, Weekday.FRIDAY]);
        const [factory] = buildCombinationFactory();
        const lottery = new BaseLottery({ drawDays, combinationFactory: factory });

        const result = lottery.getNextDrawDate(new Date(2024, 5, 5), true);
        expect(result).toEqual(new Date(2024, 5, 7));
    });

    it('generate uses the combination factory', () => {
        class DummyCombination {
            generate(arg1: number | { n?: number; partitions?: number } = 1, arg2: number = 1) {
                let n: number;
                let partitions: number;
                if (typeof arg1 === 'object' && arg1 !== null) {
                    n = arg1.n ?? 1;
                    partitions = arg1.partitions ?? 1;
                } else {
                    n = arg1 as number;
                    partitions = arg2;
                }
                return [`generated:${n}:${partitions}`];
            }
        }

        const drawDays = new DrawDays([Weekday.TUESDAY]);
        const lottery = new BaseLottery({
            drawDays,
            // stub factory: cast through unknown to CombinationFactory
            combinationFactory: (() => new DummyCombination()) as unknown as CombinationFactory
        });

        expect(lottery.generate()).toEqual(['generated:1:1']);
        expect(lottery.generate({ n: 2 })).toEqual(['generated:2:1']);
        expect(lottery.generate({ n: 2, partitions: 3 })).toEqual(['generated:2:3']);
    });

    it('getCombination uses the combination factory', () => {
        const [factory, template] = buildCombinationFactory();
        const drawDays = new DrawDays([Weekday.TUESDAY]);
        const lottery = new BaseLottery({ drawDays, combinationFactory: factory });

        const result = lottery.getCombination({ main: [1, 2] });
        expect(result).toEqual(template.getCombination({ components: { main: [1, 2] } }));
    });
});
