import { LotteryCombination, type CombinationFactory } from '../combinations/index.ts';
import type { CombinationInputWithRank, CombinationRank } from '../combinations/types.ts';
import { getFloat, getInt } from '../utils/index.ts';

const RE_NUMBER = /^(?<component>\w+)_(?<index>\d+)$/u;
const RE_RANK = /^(?<component>\w+)_rank$/u;
const RE_WINNERS = /^rank_(?<rank>\d+)_winners$/u;
const RE_GAIN = /^rank_(?<rank>\d+)_gain$/u;

const DEFAULT_DATE = '1970-01-01';

const asIsoDate = (date: Date): string => {
    const year = String(date.getUTCFullYear()).padStart(4, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const parseIsoDate = (value: unknown, fallback: string): Date => {
    const candidate = typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
    const parsed = new Date(`${candidate}T00:00:00.000Z`);

    if (Number.isNaN(parsed.getTime())) {
        return new Date(`${fallback}T00:00:00.000Z`);
    }

    return parsed;
};

const isCallable = <TArgs extends unknown[], TReturn>(value: unknown): value is (...args: TArgs) => TReturn =>
    typeof value === 'function';

/** A dictionary containing information about the content of an archive. */
export interface ArchiveContentInfo {
    count: number;
    period: string | null;
    first_date: string | null;
    last_date: string | null;
}

/** A dictionary containing information about an archive. */
export interface ArchiveInfo extends ArchiveContentInfo {
    name: string;
    url: string;
}

/** List of archives available from a provider source. */
export type Manifest = ArchiveInfo[];

/**
 * A class representing a winning rank in a lottery draw.
 *
 * @example
 * ```ts
 * const rank = new WinningRank({ rank: 1, winners: 2, gain: 1_000_000 });
 * ```
 */
export class WinningRank {
    public readonly rank: number;

    public readonly winners: number;

    public readonly gain: number;

    /**
     * @param options - Winning-rank fields.
     * @param options.rank - Rank of the winning pattern.
     * @param options.winners - Number of winners for that rank.
     * @param options.gain - Gain amount associated with the rank.
     */
    public constructor({ rank, winners, gain }: { rank: number; winners: number; gain: number }) {
        this.rank = rank;
        this.winners = winners;
        this.gain = gain;
    }
}

/**
 * A class representing a record of a lottery draw.
 *
 * @example
 * ```ts
 * const record = new DrawRecord({
 *   period: '202401',
 *   drawDate: new Date('2024-01-01T00:00:00.000Z'),
 *   deadlineDate: new Date('2024-02-01T00:00:00.000Z'),
 *   combination: new LotteryCombination(),
 *   numbers: {},
 *   winningRanks: []
 * });
 * ```
 */
export class DrawRecord {
    public readonly period: string;

    public readonly drawDate: Date;

    public readonly deadlineDate: Date;

    public readonly combination: LotteryCombination;

    public readonly numbers: Record<string, number[]>;

    public readonly winningRanks: WinningRank[];

    /**
     * @param options - Draw-record fields.
     * @param options.period - Period identifier of the draw.
     * @param options.drawDate - Draw date in UTC date form.
     * @param options.deadlineDate - Claim deadline date in UTC date form.
     * @param options.combination - Winning lottery combination.
     * @param options.numbers - Raw component values keyed by component name.
     * @param options.winningRanks - Ordered winning-rank rows.
     */
    public constructor({
        period,
        drawDate,
        deadlineDate,
        combination,
        numbers,
        winningRanks
    }: {
        period: string;
        drawDate: Date;
        deadlineDate: Date;
        combination: LotteryCombination;
        numbers: Record<string, number[]>;
        winningRanks: WinningRank[];
    }) {
        this.period = period;
        this.drawDate = drawDate;
        this.deadlineDate = deadlineDate;
        this.combination = combination;
        this.numbers = numbers;
        this.winningRanks = winningRanks;
    }

    /**
     * Convert this draw record to a flat dictionary.
     *
     * @returns Dictionary containing draw fields, component values, component ranks and winning-rank data.
     *
     * @example
     * ```ts
     * const data = record.toDict();
     * data.period;
     * ```
     */
    public toDict(): Record<string, string | number> {
        const data: Record<string, string | number> = {
            period: this.period,
            draw_date: asIsoDate(this.drawDate),
            deadline_date: asIsoDate(this.deadlineDate)
        };

        for (const [key, values] of Object.entries(this.numbers)) {
            values.forEach((value, index) => {
                data[`${key}_${index + 1}`] = value;
            });
        }

        for (const [key, component] of Object.entries(this.combination.components)) {
            data[`${key}_rank`] = component.rank;
        }

        data.combination_rank = this.combination.rank;

        this.winningRanks.forEach(winningRank => {
            data[`rank_${winningRank.rank}_winners`] = winningRank.winners;
            data[`rank_${winningRank.rank}_gain`] = winningRank.gain;
        });

        return data;
    }

    /**
     * Create a draw record from a flat dictionary.
     *
     * @param data - Dictionary containing draw fields and rank/value payloads.
     * @param combinationFactory - Optional lottery combination factory.
     * @returns Parsed draw record.
     * @throws {Error} Propagates combination-construction errors when the provided factory rejects parsed inputs.
     *
     * @example
     * ```ts
     * const record = DrawRecord.fromDict({
     *   period: '202401',
     *   draw_date: '2024-01-01',
     *   deadline_date: '2024-02-01'
     * });
     * ```
     */
    public static fromDict(
        data: Record<string, unknown>,
        combinationFactory: CombinationFactory | LotteryCombination | unknown = null
    ): DrawRecord {
        const period = String(data.period ?? '');
        const drawDate = parseIsoDate(data.draw_date, DEFAULT_DATE);
        const deadlineDate = parseIsoDate(data.deadline_date, DEFAULT_DATE);

        const numbers: Record<string, number[]> = {};
        const ranks: Record<string, number> = {};
        const winners: Record<number, number> = {};
        const gains: Record<number, number> = {};

        const known = new Set(['period', 'draw_date', 'deadline_date']);

        for (const [key, value] of Object.entries(data)) {
            if (known.has(key)) {
                continue;
            }

            const numberMatch = RE_NUMBER.exec(key);
            if (numberMatch?.groups?.component) {
                const componentName = numberMatch.groups.component;
                numbers[componentName] ??= [];
                numbers[componentName].push(getInt(value));
                continue;
            }

            const rankMatch = RE_RANK.exec(key);
            if (rankMatch?.groups?.component) {
                ranks[rankMatch.groups.component] = getInt(value);
                continue;
            }

            const winnersMatch = RE_WINNERS.exec(key);
            if (winnersMatch?.groups?.rank) {
                const rankNumber = getInt(winnersMatch.groups.rank);
                winners[rankNumber] = getInt(value);
                continue;
            }

            const gainMatch = RE_GAIN.exec(key);
            if (gainMatch?.groups?.rank) {
                const rankNumber = getInt(gainMatch.groups.rank);
                gains[rankNumber] = getFloat(value);
            }
        }

        const componentInputs: Record<string, CombinationInputWithRank> = Object.fromEntries(
            Object.entries(numbers).map(([componentName, values]) => [
                componentName,
                {
                    values,
                    rank: ranks[componentName]
                }
            ])
        );

        const combination = isCallable<[Parameters<CombinationFactory>[0] | undefined], LotteryCombination>(
            combinationFactory
        )
            ? LotteryCombination.getCombinationFactory(combinationFactory)({ components: componentInputs })
            : new LotteryCombination();

        const winningRanks = Object.keys(winners)
            .map(rank => getInt(rank))
            .sort((left, right) => left - right)
            .map(
                rank =>
                    new WinningRank({
                        rank,
                        winners: winners[rank],
                        gain: gains[rank] ?? 0
                    })
            );

        return new DrawRecord({
            period,
            drawDate,
            deadlineDate,
            combination,
            numbers,
            winningRanks
        });
    }
}

/**
 * A class representing a found combination in a lottery search.
 *
 * @example
 * ```ts
 * const found = new FoundCombination({ record, rank: 3 });
 * ```
 */
export class FoundCombination {
    public readonly record: DrawRecord;

    public readonly rank: CombinationRank;

    /**
     * @param options - Found-combination fields.
     * @param options.record - Source draw record containing the match.
     * @param options.rank - Matched rank in the source draw.
     */
    public constructor({ record, rank }: { record: DrawRecord; rank: CombinationRank }) {
        this.record = record;
        this.rank = rank;
    }
}
