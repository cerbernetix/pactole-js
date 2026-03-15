import { BoundCombination, LotteryCombination, type CombinationFactory } from 'src/combinations/index.ts';
import { DrawRecord, FoundCombination, WinningRank } from 'src/data/index.ts';
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

function buildRecord(period: string, drawDate: Date, combination: LotteryCombination): DrawRecord {
    return new DrawRecord({
        period,
        drawDate,
        deadlineDate: drawDate,
        combination,
        numbers: {
            main: combination.getComponentValues('main')
        },
        winningRanks: [
            new WinningRank({
                rank: 1,
                winners: 1,
                gain: 1
            })
        ]
    });
}

class DummyProvider {
    public readonly drawDays: DrawDays;

    public readonly combinationFactory: CombinationFactory;

    private readonly records: DrawRecord[];

    public readonly loadCalls: boolean[] = [];

    public readonly loadRawCalls: boolean[] = [];

    public constructor(drawDays: DrawDays, combinationFactory: CombinationFactory, records: DrawRecord[]) {
        this.drawDays = drawDays;
        this.combinationFactory = combinationFactory;
        this.records = records;
    }

    public async load(force = false): Promise<DrawRecord[]> {
        this.loadCalls.push(force);
        return [...this.records];
    }

    public async loadRaw(force = false): Promise<Record<string, unknown>[]> {
        this.loadRawCalls.push(force);
        return this.records.map(record => record.toDict());
    }
}

describe('BaseLottery', () => {
    it('exposes provider draw days', () => {
        const drawDays = new DrawDays([Weekday.MONDAY, Weekday.THURSDAY]);
        const [factory] = buildCombinationFactory();
        const provider = new DummyProvider(drawDays, factory, []);
        const lottery = new BaseLottery(provider);

        expect(lottery.drawDays).toBe(drawDays);
    });

    it('exposes provider combination factory', () => {
        const drawDays = new DrawDays([Weekday.MONDAY]);
        const [factory] = buildCombinationFactory();
        const provider = new DummyProvider(drawDays, factory, []);
        const lottery = new BaseLottery(provider);

        expect(lottery.combinationFactory).toBe(factory);
    });

    it('delegates last draw date to draw days', () => {
        const drawDays = new DrawDays([Weekday.TUESDAY, Weekday.FRIDAY]);
        const [factory] = buildCombinationFactory();
        const provider = new DummyProvider(drawDays, factory, []);
        const lottery = new BaseLottery(provider);

        const result = lottery.getLastDrawDate(new Date(2024, 5, 5), true);
        expect(result).toEqual(new Date(2024, 5, 4));
    });

    it('delegates next draw date to draw days', () => {
        const drawDays = new DrawDays([Weekday.TUESDAY, Weekday.FRIDAY]);
        const [factory] = buildCombinationFactory();
        const provider = new DummyProvider(drawDays, factory, []);
        const lottery = new BaseLottery(provider);

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
        const provider = new DummyProvider(
            drawDays,
            (() => new DummyCombination()) as unknown as CombinationFactory,
            []
        );
        const lottery = new BaseLottery(provider);

        expect(lottery.generate()).toEqual(['generated:1:1']);
        expect(lottery.generate({ n: 2 })).toEqual(['generated:2:1']);
        expect(lottery.generate({ n: 2, partitions: 3 })).toEqual(['generated:2:3']);
    });

    it('getCombination uses the combination factory', () => {
        const [factory, template] = buildCombinationFactory();
        const drawDays = new DrawDays([Weekday.TUESDAY]);
        const provider = new DummyProvider(drawDays, factory, []);
        const lottery = new BaseLottery(provider);

        const result = lottery.getCombination({ main: [1, 2] });
        expect(result).toEqual(template.getCombination({ components: { main: [1, 2] } }));
    });

    it('count returns number of records', async () => {
        const [factory, template] = buildCombinationFactory();
        const record = buildRecord('202401', new Date(2024, 0, 2), template.getCombination({ combination: [1, 2] }));
        const provider = new DummyProvider(new DrawDays([Weekday.TUESDAY]), factory, [record]);
        const lottery = new BaseLottery(provider);

        await expect(lottery.count()).resolves.toBe(1);
        expect(provider.loadCalls).toEqual([false]);
    });

    it('dump returns serialized records and forwards force flag', async () => {
        const [factory, template] = buildCombinationFactory();
        const record = buildRecord('202401', new Date(2024, 0, 2), template.getCombination({ combination: [1, 2] }));
        const provider = new DummyProvider(new DrawDays([Weekday.TUESDAY]), factory, [record]);
        const lottery = new BaseLottery(provider);

        await expect(lottery.dump(true)).resolves.toEqual([record.toDict()]);
        expect(provider.loadRawCalls).toEqual([true]);
        expect(provider.loadCalls).toEqual([]);
    });

    it('get_records and getRecords return cached records', async () => {
        const [factory, template] = buildCombinationFactory();
        const record = buildRecord('202401', new Date(2024, 0, 2), template.getCombination({ combination: [1, 2] }));
        const provider = new DummyProvider(new DrawDays([Weekday.TUESDAY]), factory, [record]);
        const lottery = new BaseLottery(provider);

        await expect(lottery.get_records(true)).resolves.toEqual([record]);
        await expect(lottery.getRecords()).resolves.toEqual([record]);
        expect(provider.loadCalls).toEqual([true, false]);
    });

    it('find_records filters records by combination include check', async () => {
        const [factory, template] = buildCombinationFactory();
        const recordMatch = buildRecord(
            '202401',
            new Date(2024, 0, 2),
            template.getCombination({ combination: [1, 2] })
        );
        const recordOther = buildRecord(
            '202402',
            new Date(2024, 0, 9),
            template.getCombination({ combination: [5, 6] })
        );
        const provider = new DummyProvider(new DrawDays([Weekday.TUESDAY]), factory, [recordMatch, recordOther]);
        const lottery = new BaseLottery(provider);

        const records = await lottery.find_records({ combination: [1], force: true });

        expect(records).toEqual([new FoundCombination({ record: recordMatch, rank: 2 })]);
        expect(provider.loadCalls).toEqual([true]);
    });

    it('find_records filters by target rank', async () => {
        const [factory, template] = buildCombinationFactory();
        const recordMatch = buildRecord(
            '202401',
            new Date(2024, 0, 2),
            template.getCombination({ combination: [1, 2] })
        );
        const recordOther = buildRecord(
            '202402',
            new Date(2024, 0, 9),
            template.getCombination({ combination: [5, 6] })
        );
        const provider = new DummyProvider(new DrawDays([Weekday.TUESDAY]), factory, [recordMatch, recordOther]);
        const lottery = new BaseLottery(provider);

        const records = await lottery.find_records({ combination: [1], targetRank: 2 });

        expect(records).toEqual([new FoundCombination({ record: recordMatch, rank: 2 })]);
    });

    it('find_records defaults to minimum winning rank when not strict', async () => {
        const [factory, template] = buildCombinationFactory();
        const recordRank1 = buildRecord(
            '202401',
            new Date(2024, 0, 2),
            template.getCombination({ combination: [1, 2] })
        );
        const recordRank2 = buildRecord(
            '202402',
            new Date(2024, 0, 9),
            template.getCombination({ combination: [1, 3] })
        );
        const recordNone = buildRecord(
            '202403',
            new Date(2024, 0, 16),
            template.getCombination({ combination: [5, 6] })
        );
        const provider = new DummyProvider(new DrawDays([Weekday.TUESDAY]), factory, [
            recordRank1,
            recordRank2,
            recordNone
        ]);
        const lottery = new BaseLottery(provider);

        const records = await lottery.find_records({ combination: [1] });

        expect(records).toEqual([
            new FoundCombination({ record: recordRank1, rank: 2 }),
            new FoundCombination({ record: recordRank2, rank: 2 })
        ]);
    });

    it('find_records supports strict mode with exact rank match', async () => {
        const [factory, template] = buildCombinationFactory();
        const recordRank1 = buildRecord(
            '202401',
            new Date(2024, 0, 2),
            template.getCombination({ combination: [1, 2] })
        );
        const recordRank2 = buildRecord(
            '202402',
            new Date(2024, 0, 9),
            template.getCombination({ combination: [1, 3] })
        );
        const recordNone = buildRecord(
            '202403',
            new Date(2024, 0, 16),
            template.getCombination({ combination: [5, 6] })
        );
        const provider = new DummyProvider(new DrawDays([Weekday.TUESDAY]), factory, [
            recordRank1,
            recordRank2,
            recordNone
        ]);
        const lottery = new BaseLottery(provider);

        const nonStrict = await lottery.find_records({ combination: [1, 2], targetRank: 1, strict: false });
        const strict = await lottery.find_records({ combination: [1, 2], targetRank: 1, strict: true });
        const strictNoTarget = await lottery.findRecords({ combination: [1], strict: true });

        expect(nonStrict).toEqual([
            new FoundCombination({ record: recordRank1, rank: 1 }),
            new FoundCombination({ record: recordRank2, rank: 2 })
        ]);
        expect(strict).toEqual([new FoundCombination({ record: recordRank1, rank: 1 })]);
        expect(strictNoTarget).toEqual([
            new FoundCombination({ record: recordRank1, rank: 2 }),
            new FoundCombination({ record: recordRank2, rank: 2 })
        ]);
    });
});
