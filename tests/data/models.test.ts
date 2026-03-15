import { describe, expect, it } from 'vitest';

import { BoundCombination, LotteryCombination } from 'src/combinations/index.ts';
import { DrawRecord, FoundCombination, WinningRank } from 'src/data/index.ts';

describe('DrawRecord', () => {
    it('toDict exports expected fields', () => {
        const drawDate = new Date('2024-01-15T00:00:00.000Z');
        const deadlineDate = new Date('2024-02-15T00:00:00.000Z');
        const main = new BoundCombination([12, 5, 23], {
            start: 1,
            end: 50,
            count: 3
        });
        const bonus = new BoundCombination([7], {
            start: 1,
            end: 10,
            count: 1
        });
        const combination = new LotteryCombination({ components: { main, bonus } });

        const record = new DrawRecord({
            period: '202401',
            drawDate,
            deadlineDate,
            combination,
            numbers: { main: [12, 5, 23], bonus: [7] },
            winningRanks: [
                new WinningRank({ rank: 1, winners: 2, gain: 1_000_000.0 }),
                new WinningRank({ rank: 2, winners: 10, gain: 50_000.0 })
            ]
        });

        expect(record.toDict()).toEqual({
            period: '202401',
            draw_date: '2024-01-15',
            deadline_date: '2024-02-15',
            main_1: 12,
            main_2: 5,
            main_3: 23,
            bonus_1: 7,
            main_rank: main.rank,
            bonus_rank: bonus.rank,
            combination_rank: combination.rank,
            rank_1_winners: 2,
            rank_1_gain: 1_000_000.0,
            rank_2_winners: 10,
            rank_2_gain: 50_000.0
        });
    });

    it('fromDict builds components and winning ranks with a factory', () => {
        const factory = ({
            components
        }: {
            components?: Record<string, { values?: number[]; rank?: number | null }>;
        }): LotteryCombination => {
            const mainValues = components?.main?.values ?? [];
            const bonusValues = components?.bonus?.values ?? [];

            return new LotteryCombination({
                components: {
                    main: new BoundCombination(mainValues, {
                        rank: components?.main?.rank ?? null,
                        start: 1,
                        end: 50,
                        count: 3
                    }),
                    bonus: new BoundCombination(bonusValues, {
                        rank: components?.bonus?.rank ?? null,
                        start: 1,
                        end: 10,
                        count: 1
                    })
                }
            });
        };

        const data = {
            period: '202402',
            draw_date: '2024-02-10',
            deadline_date: '2024-03-10',
            main_1: '3',
            main_2: '11',
            main_3: '5',
            bonus_1: '9',
            main_rank: '5',
            bonus_rank: '1',
            combination_rank: '123',
            rank_2_winners: '4',
            rank_1_winners: '1',
            rank_1_gain: '250000.0',
            dummy_field: 'ignored'
        };

        const record = DrawRecord.fromDict(data, factory);

        expect(record.period).toBe('202402');
        expect(record.drawDate).toEqual(new Date('2024-02-10T00:00:00.000Z'));
        expect(record.deadlineDate).toEqual(new Date('2024-03-10T00:00:00.000Z'));
        expect(record.numbers).toEqual({ main: [3, 11, 5], bonus: [9] });
        expect(record.combination.components.main?.values).toEqual([3, 5, 11]);
        expect(record.combination.components.bonus?.values).toEqual([9]);
        expect(record.winningRanks).toEqual([
            new WinningRank({ rank: 1, winners: 1, gain: 250_000.0 }),
            new WinningRank({ rank: 2, winners: 4, gain: 0.0 })
        ]);
    });

    it('fromDict falls back to an empty LotteryCombination', () => {
        const data = {
            period: '202403',
            draw_date: '2024-03-10',
            deadline_date: '2024-04-10',
            main_1: 8,
            main_2: 14,
            rank_1_winners: 2,
            rank_1_gain: 100.0
        };

        const record = DrawRecord.fromDict(data, {});

        expect(record.combination).toBeInstanceOf(LotteryCombination);
        expect(record.combination.components).toEqual({});
        expect(record.numbers).toEqual({ main: [8, 14] });
        expect(record.winningRanks).toEqual([new WinningRank({ rank: 1, winners: 2, gain: 100.0 })]);
    });

    it('fromDict falls back to default dates for invalid date values', () => {
        const record = DrawRecord.fromDict({
            period: '202404',
            draw_date: 'invalid-date',
            deadline_date: '',
            rank_1_winners: 1,
            rank_1_gain: 0
        });

        expect(record.drawDate).toEqual(new Date('1970-01-01T00:00:00.000Z'));
        expect(record.deadlineDate).toEqual(new Date('1970-01-01T00:00:00.000Z'));
    });

    it('stores found combination payload', () => {
        const record = DrawRecord.fromDict({
            draw_date: '2024-05-10',
            deadline_date: '2024-06-10'
        });

        const found = new FoundCombination({ record, rank: 4 });

        expect(found.record).toBe(record);
        expect(found.rank).toBe(4);
        expect(record.period).toBe('');
    });
});
