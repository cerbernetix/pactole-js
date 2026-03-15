import { type CombinationFactory, LotteryCombination } from '../../combinations/index.ts';
import { type DayInput, DrawDays, TimeoutCache, Weekday, fetchContent, getFloat, getInt } from '../../utils/index.ts';
import { getEnvironmentValue, registerNamespace } from '../../utils/system.ts';
import { BaseParser } from '../base-parser.ts';
import { BaseProvider } from '../base-provider.ts';
import { type ArchiveMap, BaseResolver } from '../base-resolver.ts';
import { DrawRecord, WinningRank } from '../models.ts';

const DEFAULT_DATE = '1970-01-01';

const SOURCE_DRAW_DATE = 'date_de_tirage';
const SOURCE_DEADLINE_DATE = 'date_de_forclusion';

const SOURCE_NUMBERS_MAPPING: Record<string, string> = {
    boule: 'numbers',
    etoile: 'stars',
    numero_dream: 'dream'
};

const RE_NUMBER = /^(?<component>\w+)_(?<index>\d+)$/u;
const RE_WINNERS = /^nombre_de_gagnant_au_rang(?<rank>\d+)\w*$/u;
const RE_GAIN = /^rapport_du_rang(?<rank>\d+)\w*$/u;
const RE_DISCARD = /^.*_en_france$/u;
const RE_ANCHOR = /<a\b(?<attributes>[^>]*)>/giu;
const RE_DOWNLOAD_ATTRIBUTE = /\bdownload\s*=\s*['"](?<download>[^'"]+)['"]/iu;
const RE_HREF_ATTRIBUTE = /\bhref\s*=\s*['"](?<href>[^'"]+)['"]/iu;

const toIsoDate = (value: string): string => {
    if (value.includes('-')) {
        return value;
    }

    const parts = value.includes('/') ? value.split('/') : [value.slice(6, 8), value.slice(4, 6), value.slice(0, 4)];
    if (parts.length > 2 && parts[2]?.length === 2) {
        parts[2] = `20${parts[2]}`;
    }

    return parts.reverse().join('-');
};

const toDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

const parseDownloadLinks = (content: string): ArchiveMap => {
    const links: ArchiveMap = {};

    for (const match of content.matchAll(RE_ANCHOR)) {
        const attributes = match.groups?.attributes;
        if (!attributes) {
            continue;
        }

        const download = RE_DOWNLOAD_ATTRIBUTE.exec(attributes)?.groups?.download;
        const href = RE_HREF_ATTRIBUTE.exec(attributes)?.groups?.href;

        if (download && href) {
            links[download] = href;
        }
    }

    return links;
};

const createCombinationInput = (numbers: Record<string, number[]>): Record<string, { values: number[] }> =>
    Object.fromEntries(Object.entries(numbers).map(([key, values]) => [key, { values }]));

const getSortedRanks = (winners: Record<number, number>, gains: Record<number, number>): number[] => {
    const ranks = new Set<number>();

    for (const key of Object.keys(winners)) {
        ranks.add(getInt(key));
    }

    for (const key of Object.keys(gains)) {
        ranks.add(getInt(key));
    }

    return [...ranks].sort((left, right) => left - right);
};

/**
 * Resolver for FDJ archive pages.
 */
export class FDJResolver extends BaseResolver {
    public static readonly ARCHIVES_PAGE_URL = 'https://www.fdj.fr/jeux-de-tirage/{name}/historique';

    protected readonly _archivesPageUrl: string;

    /**
     * @param archivesPageUrl - Archive page URL or lottery slug used to build one.
     * @param cacheTimeout - Resolver cache timeout in seconds.
     */
    public constructor(archivesPageUrl: string, cacheTimeout = TimeoutCache.DEFAULT_CACHE_TIMEOUT) {
        super(cacheTimeout);
        this._archivesPageUrl = archivesPageUrl.startsWith('http')
            ? archivesPageUrl
            : FDJResolver.getArchivesPageUrl(archivesPageUrl);
    }

    /**
     * Build the archive page URL from the configured template.
     *
     * @param name - Lottery slug.
     * @returns Full FDJ archive page URL.
     * @throws {Error} Thrown when the URL template does not include `{name}`.
     */
    public static getArchivesPageUrl(name: string): string {
        const template = getEnvironmentValue('FDJ_ARCHIVES_PAGE_URL') ?? FDJResolver.ARCHIVES_PAGE_URL;

        if (!template.includes('{name}')) {
            throw new Error(`Invalid URL template: '${template}'. It must contain the placeholder '{name}'.`);
        }

        return template.replaceAll('{name}', name);
    }

    protected override async _loadCache(): Promise<ArchiveMap> {
        const content = await fetchContent(this._archivesPageUrl);
        if (typeof content !== 'string') {
            return {};
        }

        return parseDownloadLinks(content);
    }
}

/**
 * Parser for FDJ archive rows.
 */
export class FDJParser extends BaseParser {
    /**
     * Parse a source row into a draw record.
     *
     * France-specific winners and gain fields ending in `_en_france` are
     * intentionally discarded to keep the aggregate values used by upstream.
     *
     * @param data - Source row from FDJ CSV payloads.
     * @returns Parsed draw record.
     */
    public override parse(data: Record<string, unknown>): DrawRecord {
        const drawDate = toIsoDate(String(data[SOURCE_DRAW_DATE] ?? DEFAULT_DATE));
        const deadlineDate = toIsoDate(String(data[SOURCE_DEADLINE_DATE] ?? DEFAULT_DATE));

        const numbers: Record<string, number[]> = {};
        const winners: Record<number, number> = {};
        const gains: Record<number, number> = {};
        const known = new Set([SOURCE_DRAW_DATE, SOURCE_DEADLINE_DATE]);

        for (const [rawKey, value] of Object.entries(data)) {
            const key = String(rawKey);
            if (known.has(key)) {
                continue;
            }

            if (key in SOURCE_NUMBERS_MAPPING) {
                const component = SOURCE_NUMBERS_MAPPING[key] as string;
                numbers[component] ??= [];
                numbers[component]?.push(getInt(value));
                continue;
            }

            const numberMatch = RE_NUMBER.exec(key);
            if (numberMatch?.groups?.component) {
                const mappedComponent =
                    SOURCE_NUMBERS_MAPPING[numberMatch.groups.component] ?? numberMatch.groups.component;
                numbers[mappedComponent] ??= [];
                numbers[mappedComponent]?.push(getInt(value));
                continue;
            }

            const winnersMatch = RE_WINNERS.exec(key);
            if (winnersMatch?.groups?.rank && !RE_DISCARD.test(key)) {
                const rankNumber = getInt(winnersMatch.groups.rank);
                if (!(rankNumber in winners)) {
                    winners[rankNumber] = getInt(value);
                }
                continue;
            }

            const gainsMatch = RE_GAIN.exec(key);
            if (gainsMatch?.groups?.rank && !RE_DISCARD.test(key)) {
                const rankNumber = getInt(gainsMatch.groups.rank);
                if (!(rankNumber in gains)) {
                    gains[rankNumber] = getFloat(value);
                }
            }
        }

        const combination = this._combinationFactory({ components: createCombinationInput(numbers) });
        const minRank = combination.minWinningRank ?? 1;
        const availableRanks = getSortedRanks(winners, gains);
        const maxAvailableRank = availableRanks.length > 0 ? availableRanks[availableRanks.length - 1] : 0;
        const maxRank = combination.maxWinningRank ?? maxAvailableRank;

        const winningRanks: WinningRank[] = [];
        for (let rank = minRank; rank <= maxRank; rank += 1) {
            winningRanks.push(
                new WinningRank({
                    rank,
                    winners: winners[rank] ?? 0,
                    gain: gains[rank] ?? 0
                })
            );
        }

        return new DrawRecord({
            period: '',
            drawDate: toDate(drawDate),
            deadlineDate: toDate(deadlineDate),
            combination,
            numbers,
            winningRanks
        });
    }
}

export interface FDJProviderOptions {
    resolver: BaseResolver | string;
    parser?: BaseParser | null;
    drawDays?: DrawDays | Iterable<DayInput | Weekday>;
    drawDayRefreshTime?: string | number | Date | null;
    combinationFactory?: CombinationFactory | LotteryCombination | unknown;
    cacheName?: string;
    cacheRootName?: string | null;
    refreshTimeout?: number;
}

/**
 * FDJ provider wiring resolver and parser defaults.
 */
export class FDJProvider extends BaseProvider {
    public static readonly DEFAULT_FDJ_CACHE_NAME = 'fdj';

    /**
     * @param options - FDJ provider options.
     */
    public constructor({
        resolver,
        parser = null,
        drawDays = [],
        drawDayRefreshTime = null,
        combinationFactory = null,
        cacheName = FDJProvider.DEFAULT_FDJ_CACHE_NAME,
        cacheRootName = null,
        refreshTimeout = BaseProvider.DEFAULT_REFRESH_TIMEOUT
    }: FDJProviderOptions) {
        const normalizedResolver = typeof resolver === 'string' ? new FDJResolver(resolver) : resolver;
        const normalizedParser = parser ?? new FDJParser(combinationFactory);

        super({
            resolver: normalizedResolver,
            parser: normalizedParser,
            drawDays,
            drawDayRefreshTime,
            combinationFactory,
            cacheName,
            cacheRootName,
            refreshTimeout
        });
    }
}

registerNamespace('pactole.data.providers.fdj', {
    FDJProvider,
    FDJResolver,
    FDJParser
});
