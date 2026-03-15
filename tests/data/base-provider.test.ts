import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { BoundCombination, LotteryCombination } from 'src/combinations/index.ts';
import { BaseParser, BaseProvider, BaseResolver, DrawRecord, WinningRank } from 'src/data/index.ts';
import * as fileUtils from 'src/utils/file.ts';
import { DrawDays, Weekday } from 'src/utils/index.ts';

import { tmpdir } from 'node:os';
import { join } from 'node:path';

class SampleResolver extends BaseResolver {
    private _archives: Record<string, string>;

    public constructor(archives: Record<string, string>) {
        super(0);
        this._archives = archives;
    }

    public setArchives(archives: Record<string, string>): void {
        this._archives = archives;
        void this.cache.clear();
    }

    protected override _loadCache(): Record<string, string> {
        return this._archives;
    }
}

const buildCombination = ({
    components
}: {
    components?: Record<string, { values?: number[]; rank?: number | null }>;
} = {}): LotteryCombination =>
    new LotteryCombination({
        components: {
            main: new BoundCombination(components?.main?.values ?? [], {
                rank: components?.main?.rank ?? null,
                start: 1,
                end: 50,
                count: 2
            })
        },
        winningRanks: { '2': 1, '1': 2 }
    });

class SampleParser extends BaseParser {
    public override parse(data: Record<string, unknown>): DrawRecord {
        const drawDate = String(data.draw_date ?? '1970-01-01');
        const deadlineDate = String(data.deadline_date ?? '1970-01-01');

        return new DrawRecord({
            period: drawDate.slice(0, 4) + drawDate.slice(5, 7),
            drawDate: new Date(`${drawDate}T00:00:00.000Z`),
            deadlineDate: new Date(`${deadlineDate}T00:00:00.000Z`),
            combination: buildCombination({
                components: {
                    main: {
                        values: [Number(data.main_1 ?? 0), Number(data.main_2 ?? 0)]
                    }
                }
            }),
            numbers: {
                main: [Number(data.main_1 ?? 0), Number(data.main_2 ?? 0)]
            },
            winningRanks: [
                new WinningRank({
                    rank: 1,
                    winners: Number(data.rank_1_winners ?? 0),
                    gain: Number(data.rank_1_gain ?? 0)
                })
            ]
        });
    }
}

class PublicProvider extends BaseProvider {
    public async buildCache(
        manifest: {
            name: string;
            url: string;
            period: string | null;
            first_date: string | null;
            last_date: string | null;
            count: number;
        }[]
    ): Promise<void> {
        await this._buildCache(manifest);
    }

    public async checkLastArchive(
        manifest: {
            name: string;
            url: string;
            period: string | null;
            first_date: string | null;
            last_date: string | null;
            count: number;
        }[]
    ): Promise<boolean> {
        return await this._checkLastArchive(manifest);
    }

    public async needRefresh(): Promise<boolean> {
        return await this._needRefresh();
    }

    public async checkArchives(
        manifest: {
            name: string;
            url: string;
            period: string | null;
            first_date: string | null;
            last_date: string | null;
            count: number;
        }[]
    ): Promise<boolean> {
        return await this._checkArchives(manifest);
    }

    public async checkArchiveChain(
        manifest: {
            name: string;
            url: string;
            period: string | null;
            first_date: string | null;
            last_date: string | null;
            count: number;
        }[]
    ): Promise<boolean> {
        return await this._checkArchiveChain(manifest);
    }

    public loadRecordList(data: Record<string, unknown>[] | null): DrawRecord[] {
        return this._loadRecordList(data);
    }

    public async loadSource(url: string, path: string): Promise<void> {
        await this._loadSource(url, path);
    }

    public async parseArchive(archivePath: string): Promise<{
        count: number;
        period: string | null;
        first_date: string | null;
        last_date: string | null;
    }> {
        return await this._parseArchive(archivePath);
    }

    public async refreshArchive(
        name: string,
        url: string,
        force = false
    ): Promise<{
        name: string;
        url: string;
        period: string | null;
        first_date: string | null;
        last_date: string | null;
        count: number;
    }> {
        return await this._refreshArchive(name, url, force);
    }

    public setRefreshTimeout(seconds: number): void {
        this._refreshTimeout.seconds = seconds;
    }
}

const buildSourceCsv = (
    rows: Array<{
        draw_date: string;
        deadline_date: string;
        main_1: string;
        main_2: string;
        rank_1_winners: string;
        rank_1_gain: string;
    }>
): string => {
    if (rows.length === 0) {
        return '';
    }

    const header = Object.keys(rows[0]);
    return `${[header.join(','), ...rows.map(row => header.map(key => row[key as keyof typeof row]).join(','))].join('\n')}\n`;
};

const setFileMtime = async (path: string, date: Date): Promise<void> => {
    const fsModule = await import('node:fs/promises');
    await fsModule.utimes(path, date, date);
};

const buildManifestEntry = ({
    name,
    url,
    period,
    first_date,
    last_date,
    count
}: {
    name: string;
    url: string;
    period: string | null;
    first_date: string | null;
    last_date: string | null;
    count: number;
}) => ({
    name,
    url,
    period,
    first_date,
    last_date,
    count
});

let cacheRoot = '';

const cacheDirectory = (rootName: string, cacheName: string): string => join(cacheRoot, rootName, cacheName);
const manifestPath = (rootName: string, cacheName: string): string =>
    join(cacheDirectory(rootName, cacheName), BaseProvider.MANIFEST_FILE_NAME);
const dataPath = (rootName: string, cacheName: string): string =>
    join(cacheDirectory(rootName, cacheName), BaseProvider.DATA_FILE_NAME);
const sourcePath = (rootName: string, cacheName: string, name: string): string =>
    join(cacheDirectory(rootName, cacheName), BaseProvider.SOURCE_DIR_NAME, `${name}.csv`);
const archivePath = (rootName: string, cacheName: string, name: string): string =>
    join(cacheDirectory(rootName, cacheName), BaseProvider.ARCHIVE_DIR_NAME, `${name}.csv`);

const asUnknownIndex = (value: unknown): Record<string, unknown> => value as Record<string, unknown>;

describe('BaseProvider', () => {
    beforeAll(async () => {
        const fsModule = await import('node:fs/promises');
        cacheRoot = await fsModule.mkdtemp(join(tmpdir(), 'pactole-provider-'));
    });

    beforeEach(() => {
        vi.useRealTimers();
        vi.spyOn(fileUtils, 'getCachePath').mockImplementation(async (rootName?: string) =>
            join(cacheRoot, rootName ?? BaseProvider.CACHE_ROOT_NAME)
        );
        delete process.env.PACTOLE_CACHE_ROOT;
    });

    afterEach(async () => {
        const fsModule = await import('node:fs/promises');
        await fsModule.rm(cacheRoot, { recursive: true, force: true });
        await fsModule.mkdir(cacheRoot, { recursive: true });
        vi.restoreAllMocks();
        vi.useRealTimers();
        delete process.env.PACTOLE_CACHE_ROOT;
    });

    afterAll(async () => {
        const fsModule = await import('node:fs/promises');
        await fsModule.rm(cacheRoot, { recursive: true, force: true });
    });

    it('wraps draw day iterables into DrawDays', () => {
        const provider = new BaseProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY, Weekday.THURSDAY]
        });

        expect(provider.drawDays).toBeInstanceOf(DrawDays);
        expect(provider.drawDays.days).toEqual([Weekday.MONDAY, Weekday.THURSDAY]);
    });

    it('exposes drawDayRefreshTime and combinationFactory getters', () => {
        const drawDays = new DrawDays([Weekday.MONDAY]);
        const refreshTime = new Date(0);
        refreshTime.setHours(21, 30, 0, 0);

        const provider = new BaseProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            drawDays,
            drawDayRefreshTime: refreshTime,
            combinationFactory: buildCombination
        });

        expect(provider.drawDays).toBe(drawDays);
        expect(provider.drawDayRefreshTime).toBe(refreshTime);
        expect(provider.combinationFactory).toBeTypeOf('function');
        expect(provider.combinationFactory({ components: { main: { values: [5, 12] } } })).toBeInstanceOf(
            LotteryCombination
        );
    });

    it('falls back to the default cache root when process is unavailable', () => {
        const originalProcess = globalThis.process;

        Reflect.deleteProperty(globalThis, 'process');

        try {
            const provider = asUnknownIndex(
                new BaseProvider({
                    resolver: new SampleResolver({}),
                    parser: new SampleParser()
                })
            );

            return expect((provider._getCacheDirectory as () => Promise<string>)()).resolves.toContain(
                BaseProvider.CACHE_ROOT_NAME
            );
        } finally {
            globalThis.process = originalProcess;
        }
    });

    it('rejects invalid draw-day refresh time inputs', () => {
        expect(
            () =>
                new BaseProvider({
                    resolver: new SampleResolver({}),
                    parser: new SampleParser(),
                    drawDayRefreshTime: 24
                })
        ).toThrow('Refresh hour must be an integer between 0 and 23.');

        expect(
            () =>
                new BaseProvider({
                    resolver: new SampleResolver({}),
                    parser: new SampleParser(),
                    drawDayRefreshTime: '12:60'
                })
        ).toThrow('Refresh minutes must be an integer between 0 and 59.');

        expect(
            () =>
                new BaseProvider({
                    resolver: new SampleResolver({}),
                    parser: new SampleParser(),
                    drawDayRefreshTime: 'invalid'
                })
        ).toThrow('Refresh time strings must use the HH:MM format.');
    });

    it('uses cache_root_name parameter before the environment variable', async () => {
        process.env.PACTOLE_CACHE_ROOT = 'env-root';

        const provider = new BaseProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            cacheRootName: 'param-root'
        });

        await provider.refresh(true);

        expect(fileUtils.getCachePath).toHaveBeenCalledWith('param-root', true);
    });

    it('uses cache_root_name from the environment when not provided', async () => {
        process.env.PACTOLE_CACHE_ROOT = 'env-root';

        const provider = new BaseProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser()
        });

        await provider.refresh(true);

        expect(fileUtils.getCachePath).toHaveBeenCalledWith('env-root', true);
    });

    it('falls back to the default cache root name', async () => {
        const provider = new BaseProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser()
        });

        await provider.refresh(true);

        expect(fileUtils.getCachePath).toHaveBeenCalledWith(BaseProvider.CACHE_ROOT_NAME, true);
    });

    it('loads records from refreshed cache data', async () => {
        const drawDays = new DrawDays([Weekday.TUESDAY]);
        const lastDrawDate = drawDays.get_last_draw_date(undefined, false);
        const payload = buildSourceCsv([
            {
                draw_date: lastDrawDate.toISOString().slice(0, 10),
                deadline_date: '2024-06-18',
                main_1: '5',
                main_2: '12',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            }
        ]);

        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(new TextEncoder().encode(payload));

        const provider = new BaseProvider({
            resolver: new SampleResolver({ 'archive-1': 'https://local.test/archive-1.csv' }),
            parser: new SampleParser(),
            drawDays,
            combinationFactory: buildCombination,
            cacheName: 'records-fresh'
        });

        const records = await provider.load(true);

        expect(records).toHaveLength(1);
        expect(records[0]?.numbers).toEqual({ main: [5, 12] });
        expect(records[0]?.combination.components.main?.values).toEqual([5, 12]);
    });

    it('loads raw cached rows', async () => {
        const payload = buildSourceCsv([
            {
                draw_date: '2024-06-11',
                deadline_date: '2024-06-18',
                main_1: '5',
                main_2: '12',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            }
        ]);

        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(new TextEncoder().encode(payload));

        const provider = new BaseProvider({
            resolver: new SampleResolver({ 'archive-1': 'https://local.test/archive-1.csv' }),
            parser: new SampleParser(),
            combinationFactory: buildCombination,
            cacheName: 'records-raw'
        });

        const rows = await provider.loadRaw(true);

        expect(rows).toHaveLength(1);
        expect(rows[0]?.draw_date).toBe('2024-06-11');
        expect(rows[0]?.main_1).toBe('5');
    });

    it('returns true from needRefresh when cache is missing', async () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            cacheName: 'refresh-missing'
        });

        await expect(provider.needRefresh()).resolves.toBe(true);
    });

    it('skips refresh while the timeout is still active', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-06-10T19:50:00.000Z'));

        const payload = buildSourceCsv([
            {
                draw_date: '2024-06-03',
                deadline_date: '2024-06-10',
                main_1: '5',
                main_2: '12',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            }
        ]);

        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(new TextEncoder().encode(payload));

        const provider = new PublicProvider({
            resolver: new SampleResolver({ 'archive-1': 'https://local.test/archive-1.csv' }),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            combinationFactory: buildCombination,
            cacheName: 'timeout-active',
            drawDayRefreshTime: '20:00',
            refreshTimeout: 300
        });

        await provider.refresh(true);

        await expect(provider.needRefresh()).resolves.toBe(false);
    });

    it('returns true from needRefresh when cache predates the draw threshold', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2024, 5, 10, 20, 10));

        const payload = buildSourceCsv([
            {
                draw_date: '2024-06-03',
                deadline_date: '2024-06-10',
                main_1: '5',
                main_2: '12',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            }
        ]);

        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(new TextEncoder().encode(payload));

        const provider = new PublicProvider({
            resolver: new SampleResolver({ 'archive-1': 'https://local.test/archive-1.csv' }),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            combinationFactory: buildCombination,
            cacheName: 'draw-threshold',
            drawDayRefreshTime: '20:00',
            refreshTimeout: 0
        });

        await provider.refresh(true);

        await setFileMtime(dataPath(BaseProvider.CACHE_ROOT_NAME, 'draw-threshold'), new Date(2024, 5, 10, 19, 50));

        await expect(provider.needRefresh()).resolves.toBe(true);
    });

    it('returns false from needRefresh when cache and records are current', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2024, 5, 11, 9, 0));

        const payload = buildSourceCsv([
            {
                draw_date: '2024-06-10',
                deadline_date: '2024-06-17',
                main_1: '5',
                main_2: '12',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            }
        ]);

        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(new TextEncoder().encode(payload));

        const provider = new PublicProvider({
            resolver: new SampleResolver({ 'archive-1': 'https://local.test/archive-1.csv' }),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            combinationFactory: buildCombination,
            cacheName: 'current-cache',
            drawDayRefreshTime: 0,
            refreshTimeout: 0
        });

        await provider.refresh(true);
        await setFileMtime(dataPath(BaseProvider.CACHE_ROOT_NAME, 'current-cache'), new Date(2024, 5, 10, 20, 10));

        await expect(provider.needRefresh()).resolves.toBe(false);
    });

    it('returns true from needRefresh when the latest cached draw is older than expected', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2024, 5, 11, 9, 0));

        const provider = asUnknownIndex(
            new PublicProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                drawDays: [Weekday.MONDAY],
                drawDayRefreshTime: 0,
                cacheName: 'stale-last-record'
            })
        );

        (provider._getDataCache as unknown as () => Promise<{
            exists: () => Promise<boolean>;
            date: () => Promise<Date>;
            load: () => Promise<DrawRecord[]>;
        }>) = async () => ({
            exists: async () => true,
            date: async () => new Date(2100, 0, 1),
            load: async () => [
                new DrawRecord({
                    period: '202406',
                    drawDate: new Date('2024-06-03T00:00:00.000Z'),
                    deadlineDate: new Date('2024-06-10T00:00:00.000Z'),
                    combination: buildCombination(),
                    numbers: { main: [5, 12] },
                    winningRanks: [new WinningRank({ rank: 1, winners: 1, gain: 100 })]
                })
            ]
        });

        await expect((provider.needRefresh as () => Promise<boolean>)()).resolves.toBe(true);
    });

    it('returns true from needRefresh when the cache contains no records', async () => {
        const provider = asUnknownIndex(
            new PublicProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                drawDays: [Weekday.MONDAY],
                cacheName: 'empty-record-cache'
            })
        );

        (provider._getDataCache as unknown as () => Promise<{
            exists: () => Promise<boolean>;
            date: () => Promise<Date>;
            load: () => Promise<DrawRecord[]>;
        }>) = async () => ({
            exists: async () => true,
            date: async () => new Date(2100, 0, 1),
            load: async () => []
        });

        await expect((provider.needRefresh as () => Promise<boolean>)()).resolves.toBe(true);
    });

    it('returns true from needRefresh when the cached record list cannot resolve its last entry', async () => {
        const provider = asUnknownIndex(
            new PublicProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                drawDays: [Weekday.MONDAY],
                cacheName: 'missing-last-record'
            })
        );

        (provider._getDataCache as unknown as () => Promise<{
            exists: () => Promise<boolean>;
            date: () => Promise<Date>;
            load: () => Promise<DrawRecord[] & { at: () => undefined }>;
        }>) = async () => ({
            exists: async () => true,
            date: async () => new Date(2100, 0, 1),
            load: async () => {
                const records = [
                    new DrawRecord({
                        period: '202406',
                        drawDate: new Date('2024-06-10T00:00:00.000Z'),
                        deadlineDate: new Date('2024-06-17T00:00:00.000Z'),
                        combination: buildCombination(),
                        numbers: { main: [5, 12] },
                        winningRanks: [new WinningRank({ rank: 1, winners: 1, gain: 100 })]
                    })
                ] as DrawRecord[] & { at: () => undefined };

                records.at = () => undefined;
                return records;
            }
        });

        await expect((provider.needRefresh as () => Promise<boolean>)()).resolves.toBe(true);
    });

    it('rebuilds the cache when the cache file is missing but the manifest exists', async () => {
        const payload = buildSourceCsv([
            {
                draw_date: '2024-06-11',
                deadline_date: '2024-06-18',
                main_1: '5',
                main_2: '12',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            }
        ]);

        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(new TextEncoder().encode(payload));

        const provider = new BaseProvider({
            resolver: new SampleResolver({ 'archive-1': 'https://local.test/archive-1.csv' }),
            parser: new SampleParser(),
            drawDays: [Weekday.TUESDAY],
            combinationFactory: buildCombination,
            cacheName: 'refresh-missing-cache'
        });

        await provider.refresh(true);

        const fsModule = await import('node:fs/promises');
        await fsModule.unlink(dataPath(BaseProvider.CACHE_ROOT_NAME, 'refresh-missing-cache'));

        await provider.refresh();

        await expect(
            fsModule.readFile(dataPath(BaseProvider.CACHE_ROOT_NAME, 'refresh-missing-cache'), 'utf-8')
        ).resolves.toContain('draw_date');
    });

    it('loads zip and plain sources correctly', async () => {
        const zipPayload = buildSourceCsv([
            {
                draw_date: '2024-01-02',
                deadline_date: '2024-01-15',
                main_1: '5',
                main_2: '12',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            }
        ]);
        const plainPayload = buildSourceCsv([
            {
                draw_date: '2024-01-09',
                deadline_date: '2024-01-20',
                main_1: '3',
                main_2: '7',
                rank_1_winners: '0',
                rank_1_gain: '0.0'
            }
        ]);
        const zipModule = await import('fflate');
        const zipContent = zipModule.zipSync({ 'data.csv': new TextEncoder().encode(zipPayload) });

        vi.spyOn(fileUtils, 'fetchContent').mockImplementation(async (url: string) => {
            if (url.endsWith('.zip')) {
                return zipContent;
            }

            return new TextEncoder().encode(plainPayload);
        });

        const provider = new BaseProvider({
            resolver: new SampleResolver({
                'archive-zip': 'https://local.test/archive.zip',
                'archive-plain': 'https://local.test/archive.csv'
            }),
            parser: new SampleParser(),
            drawDays: [Weekday.TUESDAY],
            combinationFactory: buildCombination,
            cacheName: 'refresh-zip'
        });

        await provider.refresh(true);

        const fsModule = await import('node:fs/promises');
        await expect(
            fsModule.readFile(sourcePath(BaseProvider.CACHE_ROOT_NAME, 'refresh-zip', 'archive-zip'), 'utf-8')
        ).resolves.toBe(zipPayload);
        await expect(
            fsModule.readFile(sourcePath(BaseProvider.CACHE_ROOT_NAME, 'refresh-zip', 'archive-plain'), 'utf-8')
        ).resolves.toBe(plainPayload);
    });

    it('invalidates a manifest when entries have missing or zero counts', async () => {
        const fsModule = await import('node:fs/promises');
        const cacheName = 'invalid-manifest';
        await fsModule.mkdir(cacheDirectory(BaseProvider.CACHE_ROOT_NAME, cacheName), { recursive: true });
        await fsModule.writeFile(
            manifestPath(BaseProvider.CACHE_ROOT_NAME, cacheName),
            JSON.stringify([
                { name: 'missing', url: 'https://local.test/missing.csv' },
                { name: 'zero', url: 'https://local.test/zero.csv', count: 0 }
            ])
        );

        const provider = new BaseProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            cacheName
        });

        const loadManifest = vi.spyOn(
            provider as BaseProvider & { _loadManifest: (force: boolean) => Promise<unknown> },
            '_loadManifest'
        );

        await provider.refresh();

        expect(loadManifest).toHaveBeenCalledWith(false);
    });

    it('normalizes manifest cache entries with strict string coercion', async () => {
        const cacheName = 'manifest-normalization';
        const fsModule = await import('node:fs/promises');
        await fsModule.mkdir(cacheDirectory(BaseProvider.CACHE_ROOT_NAME, cacheName), { recursive: true });
        await fsModule.writeFile(
            manifestPath(BaseProvider.CACHE_ROOT_NAME, cacheName),
            JSON.stringify([
                {
                    name: 'valid-1',
                    url: 'https://local.test/archive.csv',
                    period: '202406',
                    first_date: '2024-06-03',
                    last_date: '2024-06-10',
                    count: 2
                },
                {
                    name: 123,
                    url: 'https://local.test/ignored-name.csv',
                    period: 202406,
                    first_date: 20240603,
                    last_date: 20240610,
                    count: '2'
                },
                {
                    name: 'ignored-url',
                    url: false,
                    period: null,
                    first_date: null,
                    last_date: null,
                    count: 1
                }
            ])
        );

        const provider = asUnknownIndex(
            new BaseProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                cacheName
            })
        );

        const manifestCache = await (provider._getManifestCache as () => Promise<{ load: () => Promise<unknown[]> }>)();
        await expect(manifestCache.load()).resolves.toEqual([
            {
                name: 'valid-1',
                url: 'https://local.test/archive.csv',
                period: '202406',
                first_date: '2024-06-03',
                last_date: '2024-06-10',
                count: 2
            }
        ]);
    });

    it('checkArchives adds newly discovered archives to the manifest', async () => {
        const payload = buildSourceCsv([
            {
                draw_date: '2024-06-10',
                deadline_date: '2024-06-17',
                main_1: '5',
                main_2: '12',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            }
        ]);
        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(new TextEncoder().encode(payload));

        const provider = new PublicProvider({
            resolver: new SampleResolver({
                'archive-1': 'https://local.test/archive-1.csv',
                'archive-2': 'https://local.test/archive-2.csv'
            }),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            cacheName: 'check-archives'
        });

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: '202406',
                first_date: '2024-06-03',
                last_date: '2024-06-03',
                count: 1
            })
        ];

        await expect(provider.checkArchives(manifest)).resolves.toBe(true);
        expect(manifest).toHaveLength(2);
        expect(manifest[1]?.name).toBe('archive-2');
    });

    it('checkArchiveChain refreshes the previous archive when a draw gap is detected', async () => {
        const payload = buildSourceCsv([
            {
                draw_date: '2024-06-03',
                deadline_date: '2024-06-10',
                main_1: '5',
                main_2: '12',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            },
            {
                draw_date: '2024-06-10',
                deadline_date: '2024-06-17',
                main_1: '6',
                main_2: '13',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            }
        ]);
        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(new TextEncoder().encode(payload));

        const provider = new PublicProvider({
            resolver: new SampleResolver({
                'archive-1': 'https://local.test/archive-1.csv',
                'archive-2': 'https://local.test/archive-2.csv'
            }),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            cacheName: 'check-chain'
        });

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: '202406',
                first_date: '2024-06-03',
                last_date: '2024-06-03',
                count: 1
            }),
            buildManifestEntry({
                name: 'archive-2',
                url: 'https://local.test/archive-2.csv',
                period: '202406',
                first_date: '2024-06-17',
                last_date: '2024-06-17',
                count: 1
            })
        ];

        await expect(provider.checkArchiveChain(manifest)).resolves.toBe(true);
        expect(manifest[0]?.last_date).toBe('2024-06-10');
    });

    it('checkArchiveChain returns false when archive dates are missing', async () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            cacheName: 'check-chain-missing-dates'
        });

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: '202406',
                first_date: null,
                last_date: null,
                count: 1
            }),
            buildManifestEntry({
                name: 'archive-2',
                url: 'https://local.test/archive-2.csv',
                period: '202406',
                first_date: '2024-06-17',
                last_date: '2024-06-17',
                count: 1
            })
        ];

        await expect(provider.checkArchiveChain(manifest)).resolves.toBe(false);
    });

    it('checkArchiveChain accepts null last_date values during sort normalization', async () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            cacheName: 'check-chain-null-last-date'
        });

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: null,
                first_date: null,
                last_date: null,
                count: 1
            }),
            buildManifestEntry({
                name: 'archive-2',
                url: 'https://local.test/archive-2.csv',
                period: '202406',
                first_date: '2024-06-17',
                last_date: '2024-06-17',
                count: 1
            })
        ];

        await expect(provider.checkArchiveChain(manifest)).resolves.toBe(false);
    });

    it('checkArchiveChain handles sort comparisons where both last_date values are null', async () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            cacheName: 'check-chain-both-null-last-date'
        });

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: null,
                first_date: null,
                last_date: null,
                count: 1
            }),
            buildManifestEntry({
                name: 'archive-2',
                url: 'https://local.test/archive-2.csv',
                period: null,
                first_date: null,
                last_date: null,
                count: 1
            })
        ];

        await expect(provider.checkArchiveChain(manifest)).resolves.toBe(false);
    });

    it('checkArchiveChain returns false when the archive chain is contiguous', async () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            cacheName: 'check-chain-contiguous'
        });

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: '202406',
                first_date: '2024-06-03',
                last_date: '2024-06-10',
                count: 2
            }),
            buildManifestEntry({
                name: 'archive-2',
                url: 'https://local.test/archive-2.csv',
                period: '202406',
                first_date: '2024-06-17',
                last_date: '2024-06-17',
                count: 1
            })
        ];

        await expect(provider.checkArchiveChain(manifest)).resolves.toBe(false);
    });

    it('checkArchiveChain accepts non-ISO date strings through the date fallback parser', async () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            cacheName: 'check-chain-fallback-date'
        });

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: '202406',
                first_date: 'June 3, 2024',
                last_date: 'June 10, 2024',
                count: 2
            }),
            buildManifestEntry({
                name: 'archive-2',
                url: 'https://local.test/archive-2.csv',
                period: '202406',
                first_date: 'June 17, 2024',
                last_date: 'June 17, 2024',
                count: 1
            })
        ];

        await expect(provider.checkArchiveChain(manifest)).resolves.toBe(false);
    });

    it('buildCache skips archives that are missing on disk', async () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            drawDays: [Weekday.TUESDAY],
            combinationFactory: buildCombination,
            cacheName: 'missing-archive'
        });

        await provider.buildCache([
            {
                name: 'missing',
                url: 'https://local.test/missing.csv',
                period: '202401',
                first_date: '2024-01-02',
                last_date: '2024-01-02',
                count: 1
            }
        ]);

        const fsModule = await import('node:fs/promises');
        await expect(
            fsModule.readFile(dataPath(BaseProvider.CACHE_ROOT_NAME, 'missing-archive'), 'utf-8')
        ).resolves.toBe('');
    });

    it('buildCache uses fallback period when an archive period is missing', async () => {
        const cacheName = 'missing-period';
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            combinationFactory: buildCombination,
            cacheName
        });

        const fsModule = await import('node:fs/promises');
        const path = archivePath(BaseProvider.CACHE_ROOT_NAME, cacheName, 'archive-1');
        await fsModule.mkdir(
            join(cacheDirectory(BaseProvider.CACHE_ROOT_NAME, cacheName), BaseProvider.ARCHIVE_DIR_NAME),
            {
                recursive: true
            }
        );
        await fsModule.writeFile(
            path,
            buildSourceCsv([
                {
                    draw_date: '2024-06-10',
                    deadline_date: '2024-06-17',
                    main_1: '5',
                    main_2: '12',
                    rank_1_winners: '1',
                    rank_1_gain: '100.0'
                }
            ])
        );

        await provider.buildCache([
            {
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: null,
                first_date: '2024-06-10',
                last_date: '2024-06-10',
                count: 1
            }
        ]);

        const rawData = await fsModule.readFile(dataPath(BaseProvider.CACHE_ROOT_NAME, cacheName), 'utf-8');
        expect(rawData).toContain('period,draw_date');
        expect(rawData).toContain('unknown,2024-06-10');
    });

    it('loadRecordList returns an empty array for null input', () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            cacheName: 'record-list'
        });

        expect(provider.loadRecordList(null)).toEqual([]);
    });

    it('loadRecordList converts raw rows into draw records', () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            combinationFactory: buildCombination,
            cacheName: 'record-list-values'
        });

        const records = provider.loadRecordList([
            {
                period: '202406',
                draw_date: '2024-06-10',
                deadline_date: '2024-06-17',
                main_1: '5',
                main_2: '12',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            }
        ]);

        expect(records).toHaveLength(1);
        expect(records[0]).toBeInstanceOf(DrawRecord);
        expect(records[0]?.numbers).toEqual({ main: [5, 12] });
    });

    it('loadSource accepts plain string payloads', async () => {
        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue('draw_date\n2024-06-10\n');

        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            cacheName: 'string-source'
        });
        const filePath = sourcePath(BaseProvider.CACHE_ROOT_NAME, 'string-source', 'archive-1');

        await provider.loadSource('https://local.test/archive-1.csv', filePath);

        const fsModule = await import('node:fs/promises');
        await expect(fsModule.readFile(filePath, 'utf-8')).resolves.toBe('draw_date\n2024-06-10\n');
    });

    it('loadRaw returns an empty array when cache raw data is not a list', async () => {
        const provider = asUnknownIndex(
            new BaseProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                cacheName: 'load-raw-invalid'
            })
        );

        (provider._refreshIfNeeded as (force?: boolean) => Promise<void>) = async () => {};
        (provider._getDataCache as () => Promise<{ loadRaw: () => Promise<unknown> }>) = async () => ({
            loadRaw: async () => ({ invalid: true })
        });

        await expect((provider.loadRaw as (force?: boolean) => Promise<Record<string, unknown>[]>)()).resolves.toEqual(
            []
        );
    });

    it('parseArchive ignores rows without draw_date values', async () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            cacheName: 'parse-archive'
        });
        const archiveFilePath = sourcePath(BaseProvider.CACHE_ROOT_NAME, 'parse-archive', 'archive-1');
        const fsModule = await import('node:fs/promises');
        await fsModule.mkdir(
            join(cacheDirectory(BaseProvider.CACHE_ROOT_NAME, 'parse-archive'), BaseProvider.SOURCE_DIR_NAME),
            {
                recursive: true
            }
        );
        await fsModule.writeFile(archiveFilePath, 'other\nvalue\n');

        await expect(provider.parseArchive(archiveFilePath)).resolves.toEqual({
            count: 1,
            period: null,
            first_date: null,
            last_date: null
        });
    });

    it('parseArchive keeps last_date when later rows are older than the current max', async () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            cacheName: 'parse-archive-ordered'
        });

        const archiveFilePath = sourcePath(BaseProvider.CACHE_ROOT_NAME, 'parse-archive-ordered', 'archive-1');
        const fsModule = await import('node:fs/promises');
        await fsModule.mkdir(
            join(cacheDirectory(BaseProvider.CACHE_ROOT_NAME, 'parse-archive-ordered'), BaseProvider.SOURCE_DIR_NAME),
            {
                recursive: true
            }
        );
        await fsModule.writeFile(
            archiveFilePath,
            [
                'draw_date,deadline_date,main_1,main_2,rank_1_winners,rank_1_gain',
                '2024-06-10,2024-06-17,5,12,1,100.0',
                '2024-06-03,2024-06-10,3,7,0,0.0'
            ].join('\n')
        );

        await expect(provider.parseArchive(archiveFilePath)).resolves.toEqual({
            count: 2,
            period: '202406',
            first_date: '2024-06-03',
            last_date: '2024-06-10'
        });
    });

    it('refreshArchive skips source and archive regeneration when cached files are valid', async () => {
        const cacheName = 'refresh-archive-valid-cache';
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            cacheName
        });

        const sourceFilePath = sourcePath(BaseProvider.CACHE_ROOT_NAME, cacheName, 'archive-1');
        const archiveFilePath = archivePath(BaseProvider.CACHE_ROOT_NAME, cacheName, 'archive-1');
        const fsModule = await import('node:fs/promises');

        await fsModule.mkdir(
            join(cacheDirectory(BaseProvider.CACHE_ROOT_NAME, cacheName), BaseProvider.SOURCE_DIR_NAME),
            {
                recursive: true
            }
        );
        await fsModule.mkdir(
            join(cacheDirectory(BaseProvider.CACHE_ROOT_NAME, cacheName), BaseProvider.ARCHIVE_DIR_NAME),
            {
                recursive: true
            }
        );

        await fsModule.writeFile(sourceFilePath, 'draw_date\n2024-06-10\n');
        await fsModule.writeFile(
            archiveFilePath,
            [
                'draw_date,deadline_date,main_1,main_2,rank_1_winners,rank_1_gain',
                '2024-06-10,2024-06-17,5,12,1,100.0'
            ].join('\n')
        );

        const fetchSpy = vi.spyOn(fileUtils, 'fetchContent');

        const result = await provider.refreshArchive('archive-1', 'https://local.test/archive-1.csv');

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(result.count).toBe(1);
        expect(result.last_date).toBe('2024-06-10');
    });

    it('refreshArchive regenerates source and archive when existing files are empty', async () => {
        const cacheName = 'refresh-archive-empty-cache';
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            cacheName
        });

        const sourceFilePath = sourcePath(BaseProvider.CACHE_ROOT_NAME, cacheName, 'archive-1');
        const archiveFilePath = archivePath(BaseProvider.CACHE_ROOT_NAME, cacheName, 'archive-1');
        const fsModule = await import('node:fs/promises');

        await fsModule.mkdir(
            join(cacheDirectory(BaseProvider.CACHE_ROOT_NAME, cacheName), BaseProvider.SOURCE_DIR_NAME),
            {
                recursive: true
            }
        );
        await fsModule.mkdir(
            join(cacheDirectory(BaseProvider.CACHE_ROOT_NAME, cacheName), BaseProvider.ARCHIVE_DIR_NAME),
            {
                recursive: true
            }
        );

        await fsModule.writeFile(sourceFilePath, '');
        await fsModule.writeFile(archiveFilePath, '');

        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(
            new TextEncoder().encode(
                buildSourceCsv([
                    {
                        draw_date: '2024-06-10',
                        deadline_date: '2024-06-17',
                        main_1: '5',
                        main_2: '12',
                        rank_1_winners: '1',
                        rank_1_gain: '100.0'
                    }
                ])
            )
        );

        const result = await provider.refreshArchive('archive-1', 'https://local.test/archive-1.csv');

        expect(result.count).toBe(1);
        expect(result.first_date).toBe('2024-06-10');
    });

    it('returns an empty row list when reading a missing CSV source', async () => {
        const provider = asUnknownIndex(
            new BaseProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                cacheName: 'missing-csv-rows'
            })
        );

        await expect(
            (provider._readCsvRows as (path: string) => Promise<Record<string, string>[]>)(
                sourcePath(BaseProvider.CACHE_ROOT_NAME, 'missing-csv-rows', 'archive-1')
            )
        ).resolves.toEqual([]);
    });

    it('reuses the same internal cache helpers after initialization', async () => {
        const provider = asUnknownIndex(
            new BaseProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                cacheName: 'cache-helpers'
            })
        );

        const getCacheDirectory = () => (provider._getCacheDirectory as () => Promise<string>).call(provider);
        const getManifestCache = () => (provider._getManifestCache as () => Promise<unknown>).call(provider);
        const getDataCache = () => (provider._getDataCache as () => Promise<unknown>).call(provider);

        const firstDirectory = await getCacheDirectory();
        const secondDirectory = await getCacheDirectory();
        const firstManifestCache = await getManifestCache();
        const secondManifestCache = await getManifestCache();
        const firstDataCache = await getDataCache();
        const secondDataCache = await getDataCache();

        expect(firstDirectory).toBe(secondDirectory);
        expect(firstManifestCache).toBe(secondManifestCache);
        expect(firstDataCache).toBe(secondDataCache);
        expect(fileUtils.getCachePath).toHaveBeenCalledTimes(1);
    });

    it('returns an empty cached record list when the data file is missing', async () => {
        const provider = asUnknownIndex(
            new BaseProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                cacheName: 'missing-data-cache'
            })
        );

        const dataCache = await (provider._getDataCache as () => Promise<{ load: () => Promise<DrawRecord[]> }>)();
        await expect(dataCache.load()).resolves.toEqual([]);
    });

    it('returns an empty cached record list when data cache raw content is not an array', async () => {
        const cacheName = 'invalid-data-cache';
        const provider = asUnknownIndex(
            new BaseProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                cacheName
            })
        );

        const fsModule = await import('node:fs/promises');
        await fsModule.mkdir(cacheDirectory(BaseProvider.CACHE_ROOT_NAME, cacheName), { recursive: true });
        await fsModule.writeFile(
            dataPath(BaseProvider.CACHE_ROOT_NAME, cacheName),
            JSON.stringify({ draw_date: '2024-06-10' })
        );

        const dataCache = await (provider._getDataCache as () => Promise<{ load: () => Promise<DrawRecord[]> }>)();
        await expect(dataCache.load()).resolves.toEqual([]);
    });

    it('transforms cached csv rows into records through the data cache transformer', async () => {
        const cacheName = 'transform-array-data-cache';
        const payload = buildSourceCsv([
            {
                draw_date: '2024-06-10',
                deadline_date: '2024-06-17',
                main_1: '5',
                main_2: '12',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            }
        ]);
        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(new TextEncoder().encode(payload));

        const writerProvider = new BaseProvider({
            resolver: new SampleResolver({ 'archive-1': 'https://local.test/archive-1.csv' }),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            combinationFactory: buildCombination,
            cacheName
        });
        await writerProvider.refresh(true);

        const readerProvider = asUnknownIndex(
            new BaseProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                combinationFactory: buildCombination,
                cacheName
            })
        );

        const dataCache = await (
            readerProvider._getDataCache as () => Promise<{ load: () => Promise<DrawRecord[]> }>
        )();
        await expect(dataCache.load()).resolves.toHaveLength(1);
    });

    it('refresh evaluates existing cache without rebuild when no archive checks update data', async () => {
        const provider = asUnknownIndex(
            new BaseProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                cacheName: 'refresh-no-rebuild'
            })
        );

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: '202406',
                first_date: '2024-06-03',
                last_date: '2024-06-10',
                count: 2
            })
        ];

        const buildCache = vi.fn(async () => {});

        (provider._getManifestCache as () => Promise<{
            load: () => Promise<typeof manifest>;
            set: () => Promise<void>;
        }>) = async () => ({
            load: async () => manifest,
            set: async () => {}
        });
        (provider._checkArchives as () => Promise<boolean>) = async () => false;
        (provider._checkArchiveChain as () => Promise<boolean>) = async () => false;
        (provider._checkLastArchive as () => Promise<boolean>) = async () => false;
        (provider._getDataCache as () => Promise<{ exists: () => Promise<boolean> }>) = async () => ({
            exists: async () => true
        });
        provider._buildCache = buildCache;

        await (provider.refresh as (force?: boolean) => Promise<void>)();

        expect(buildCache).not.toHaveBeenCalled();
    });

    it('refresh keeps the refreshed flag true when only the last archive check is false', async () => {
        const provider = asUnknownIndex(
            new BaseProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                cacheName: 'refresh-last-archive-false'
            })
        );

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: '202406',
                first_date: '2024-06-03',
                last_date: '2024-06-10',
                count: 2
            })
        ];

        const buildCache = vi.fn(async () => {});

        (provider._getManifestCache as () => Promise<{
            load: () => Promise<typeof manifest>;
            set: () => Promise<void>;
        }>) = async () => ({
            load: async () => manifest,
            set: async () => {}
        });
        (provider._checkArchives as () => Promise<boolean>) = async () => true;
        (provider._checkArchiveChain as () => Promise<boolean>) = async () => false;
        (provider._checkLastArchive as () => Promise<boolean>) = async () => false;
        (provider._getDataCache as () => Promise<{ exists: () => Promise<boolean> }>) = async () => ({
            exists: async () => true
        });
        provider._buildCache = buildCache;

        await (provider.refresh as (force?: boolean) => Promise<void>)();

        expect(buildCache).toHaveBeenCalledOnce();
    });

    it('checkLastArchive refreshes the latest archive after the draw threshold', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2024, 5, 10, 21, 30));

        const payload = buildSourceCsv([
            {
                draw_date: '2024-06-10',
                deadline_date: '2024-06-17',
                main_1: '3',
                main_2: '7',
                rank_1_winners: '0',
                rank_1_gain: '0.0'
            }
        ]);
        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(new TextEncoder().encode(payload));

        const provider = new PublicProvider({
            resolver: new SampleResolver({ 'archive-1': 'https://local.test/archive-1.csv' }),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            drawDayRefreshTime: '21:00',
            cacheName: 'check-last'
        });

        const manifest = [
            {
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: '202406',
                first_date: '2024-06-03',
                last_date: '2024-06-03',
                count: 1
            }
        ];

        await expect(provider.checkLastArchive(manifest)).resolves.toBe(true);
        expect(manifest[0]?.last_date).toBe('2024-06-10');
    });

    it('checkLastArchive returns false for an empty manifest', async () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            cacheName: 'check-last-empty'
        });

        await expect(provider.checkLastArchive([])).resolves.toBe(false);
    });

    it('checkLastArchive returns false when the latest archive is already current', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2024, 5, 10, 21, 30));

        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            drawDayRefreshTime: '21:00',
            cacheName: 'check-last-current'
        });

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: '202406',
                first_date: '2024-06-03',
                last_date: '2024-06-10',
                count: 1
            })
        ];

        await expect(provider.checkLastArchive(manifest)).resolves.toBe(false);
    });

    it('checkLastArchive sorts multiple archives and handles null last_date entries', async () => {
        const provider = asUnknownIndex(
            new PublicProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                drawDays: [Weekday.MONDAY],
                drawDayRefreshTime: '21:00',
                cacheName: 'check-last-sort-null'
            })
        );

        (provider._refreshArchive as () => Promise<unknown>) = async () =>
            buildManifestEntry({
                name: 'archive-2',
                url: 'https://local.test/archive-2.csv',
                period: '202406',
                first_date: '2024-06-17',
                last_date: '2024-06-17',
                count: 1
            });
        (provider._getManifestCache as () => Promise<{ set: () => Promise<void> }>) = async () => ({
            set: async () => {}
        });

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: null,
                first_date: null,
                last_date: null,
                count: 1
            }),
            buildManifestEntry({
                name: 'archive-2',
                url: 'https://local.test/archive-2.csv',
                period: '202406',
                first_date: '2024-06-17',
                last_date: '2024-06-17',
                count: 1
            })
        ];

        await expect((provider.checkLastArchive as (m: typeof manifest) => Promise<boolean>)(manifest)).resolves.toBe(
            true
        );
    });

    it('checkLastArchive handles sort comparisons where both last_date values are null', async () => {
        const provider = asUnknownIndex(
            new PublicProvider({
                resolver: new SampleResolver({}),
                parser: new SampleParser(),
                drawDays: [Weekday.MONDAY],
                drawDayRefreshTime: '21:00',
                cacheName: 'check-last-both-null'
            })
        );

        (provider._refreshArchive as () => Promise<unknown>) = async () =>
            buildManifestEntry({
                name: 'archive-2',
                url: 'https://local.test/archive-2.csv',
                period: null,
                first_date: null,
                last_date: null,
                count: 1
            });
        (provider._getManifestCache as () => Promise<{ set: () => Promise<void> }>) = async () => ({
            set: async () => {}
        });

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: null,
                first_date: null,
                last_date: null,
                count: 1
            }),
            buildManifestEntry({
                name: 'archive-2',
                url: 'https://local.test/archive-2.csv',
                period: null,
                first_date: null,
                last_date: null,
                count: 1
            })
        ];

        await expect((provider.checkLastArchive as (m: typeof manifest) => Promise<boolean>)(manifest)).resolves.toBe(
            true
        );
    });

    it('checkLastArchive returns false when the latest manifest entry cannot be resolved', async () => {
        const provider = new PublicProvider({
            resolver: new SampleResolver({}),
            parser: new SampleParser(),
            cacheName: 'check-last-missing'
        });

        const manifest = [
            buildManifestEntry({
                name: 'archive-1',
                url: 'https://local.test/archive-1.csv',
                period: '202406',
                first_date: '2024-06-03',
                last_date: '2024-06-10',
                count: 1
            })
        ] as typeof provider extends PublicProvider
            ? {
                  name: string;
                  url: string;
                  period: string | null;
                  first_date: string | null;
                  last_date: string | null;
                  count: number;
              }[] & { at: () => undefined }
            : never;

        manifest.at = () => undefined;

        await expect(provider.checkLastArchive(manifest)).resolves.toBe(false);
    });

    it('keeps the manifest unchanged when the resolver returns no archives', async () => {
        const payload = buildSourceCsv([
            {
                draw_date: '2024-06-10',
                deadline_date: '2024-06-17',
                main_1: '5',
                main_2: '12',
                rank_1_winners: '1',
                rank_1_gain: '100.0'
            }
        ]);
        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(new TextEncoder().encode(payload));

        const resolver = new SampleResolver({ 'archive-1': 'https://local.test/archive-1.csv' });
        const provider = new BaseProvider({
            resolver,
            parser: new SampleParser(),
            drawDays: [Weekday.MONDAY],
            combinationFactory: buildCombination,
            cacheName: 'no-archives'
        });

        await provider.refresh(true);
        resolver.setArchives({});

        await provider.refresh();

        const fsModule = await import('node:fs/promises');
        const manifest = JSON.parse(
            await fsModule.readFile(manifestPath(BaseProvider.CACHE_ROOT_NAME, 'no-archives'), 'utf-8')
        );

        expect(manifest).toHaveLength(1);
        expect(await provider.load()).toHaveLength(1);
    });
});
