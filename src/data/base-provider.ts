import { LotteryCombination, type CombinationFactory } from '../combinations/index.ts';
import {
    DrawDays,
    File,
    FileCache,
    FileType,
    Timeout,
    Weekday,
    ensureDirectory,
    fetchContent,
    getCachePath,
    getEnvironmentValue,
    isZipContent,
    readCsvFile,
    readZipFile,
    type DayInput
} from '../utils/index.ts';
import { BaseParser } from './base-parser.ts';
import { BaseResolver } from './base-resolver.ts';
import { DrawRecord, type ArchiveInfo, type Manifest } from './models.ts';

const DEFAULT_ENV_CACHE_ROOT_NAME = 'PACTOLE_CACHE_ROOT';
const DEFAULT_ENCODING = 'utf-8';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const normalizePath = (...parts: string[]): string =>
    parts
        .map((part, index) => {
            const normalized = part.replaceAll('\\', '/');
            if (index === 0) {
                return normalized.replace(/\/+$/u, '');
            }

            return normalized.replace(/^\/+|\/+$/gu, '');
        })
        .filter(part => part.length > 0)
        .join('/');

const toLocalDateKey = (date: Date): string => {
    const year = String(date.getFullYear()).padStart(4, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const toUtcDateKey = (date: Date): string => {
    const year = String(date.getUTCFullYear()).padStart(4, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const parseLocalIsoDate = (value: string): Date => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
    if (!match) {
        return Weekday.get_date(value);
    }

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
};

const createRefreshTime = (hours: number, minutes = 0): Date => {
    if (!Number.isInteger(hours) || hours < 0 || hours > 23) {
        throw new RangeError('Refresh hour must be an integer between 0 and 23.');
    }

    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
        throw new RangeError('Refresh minutes must be an integer between 0 and 59.');
    }

    const time = new Date(0);
    time.setHours(hours, minutes, 0, 0);
    return time;
};

const normalizeRefreshTime = (value: string | number | Date | null | undefined): Date => {
    if (typeof value === 'number') {
        return createRefreshTime(value);
    }

    if (typeof value === 'string') {
        const match = /^(?<hours>\d{1,2}):(?<minutes>\d{2})$/u.exec(value.trim());
        if (!match?.groups) {
            throw new RangeError('Refresh time strings must use the HH:MM format.');
        }

        return createRefreshTime(Number(match.groups.hours), Number(match.groups.minutes));
    }

    if (value instanceof Date) {
        return value;
    }

    return createRefreshTime(22, 0);
};

const getTimeValue = (date: Date): number =>
    date.getHours() * 60 * 60 * 1000 +
    date.getMinutes() * 60 * 1000 +
    date.getSeconds() * 1000 +
    date.getMilliseconds();

const combineDateAndTime = (date: Date, time: Date): Date => {
    const combined = new Date(date);
    combined.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
    return combined;
};

const normalizeManifest = (value: unknown): Manifest => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter(isRecord)
        .map(entry => ({
            name: typeof entry.name === 'string' ? entry.name : '',
            url: typeof entry.url === 'string' ? entry.url : '',
            period: typeof entry.period === 'string' ? entry.period : null,
            first_date: typeof entry.first_date === 'string' ? entry.first_date : null,
            last_date: typeof entry.last_date === 'string' ? entry.last_date : null,
            count: typeof entry.count === 'number' ? entry.count : 0
        }))
        .filter(entry => entry.name.length > 0 && entry.url.length > 0);
};

/**
 * Options for creating a {@link BaseProvider}.
 */
export interface BaseProviderOptions {
    /** Resolver used to discover available source archives. */
    resolver: BaseResolver;
    /** Parser used to transform source rows into draw records. */
    parser: BaseParser;
    /** Draw schedule used to determine whether cached data is stale. */
    drawDays?: DrawDays | Iterable<DayInput | Weekday>;
    /**
     * Refresh threshold used on draw days.
     *
     * Accepts `HH:MM`, an hour number, or a `Date` whose time component is used.
     */
    drawDayRefreshTime?: string | number | Date | null;
    /** Combination factory used when rebuilding draw records from cache. */
    combinationFactory?: CombinationFactory | LotteryCombination | unknown;
    /** Cache namespace under the provider cache root. */
    cacheName?: string;
    /** Optional cache root override. Falls back to `PACTOLE_CACHE_ROOT` then `pactole`. */
    cacheRootName?: string | null;
    /** Refresh timeout in seconds. */
    refreshTimeout?: number;
}

/**
 * Base class for data providers.
 *
 * This class orchestrates resolver discovery, source downloads, source parsing,
 * manifest tracking, and file-backed draw-record caching.
 *
 * @example
 * ```ts
 * const provider = new BaseProvider({
 *   resolver,
 *   parser,
 *   drawDays: [Weekday.TUESDAY, Weekday.FRIDAY],
 *   combinationFactory: LotteryCombination,
 *   cacheName: 'euromillions'
 * });
 *
 * const records = await provider.load();
 * ```
 */
export class BaseProvider {
    public static readonly CACHE_ROOT_NAME = 'pactole';

    public static readonly SOURCE_DIR_NAME = 'sources';

    public static readonly ARCHIVE_DIR_NAME = 'archives';

    public static readonly MANIFEST_FILE_NAME = 'manifest.json';

    public static readonly DATA_FILE_NAME = 'data.csv';

    public static readonly DEFAULT_CACHE_NAME = 'default';

    public static readonly DEFAULT_REFRESH_TIMEOUT = 300;

    protected readonly _resolver: BaseResolver;

    protected readonly _parser: BaseParser;

    protected readonly _drawDays: DrawDays;

    protected readonly _drawDayRefreshTime: Date;

    protected readonly _refreshTimeout: Timeout;

    protected readonly _combinationFactory: CombinationFactory;

    private readonly _cacheName: string;

    private readonly _cacheRootName: string;

    private _cachePathPromise: Promise<string> | null = null;

    private _manifest: FileCache<unknown, Manifest> | null = null;

    private _cache: FileCache<Record<string, unknown>[], DrawRecord[]> | null = null;

    public constructor({
        resolver,
        parser,
        drawDays = [],
        drawDayRefreshTime = null,
        combinationFactory = null,
        cacheName = BaseProvider.DEFAULT_CACHE_NAME,
        cacheRootName = null,
        refreshTimeout = BaseProvider.DEFAULT_REFRESH_TIMEOUT
    }: BaseProviderOptions) {
        this._resolver = resolver;
        this._parser = parser;
        this._cacheName = cacheName;
        this._cacheRootName =
            cacheRootName ?? getEnvironmentValue(DEFAULT_ENV_CACHE_ROOT_NAME) ?? BaseProvider.CACHE_ROOT_NAME;
        this._drawDays = drawDays instanceof DrawDays ? drawDays : new DrawDays(drawDays);
        this._drawDayRefreshTime = normalizeRefreshTime(drawDayRefreshTime);
        this._refreshTimeout = new Timeout(refreshTimeout, false);
        this._combinationFactory = LotteryCombination.getCombinationFactory(combinationFactory);
    }

    /**
     * Draw schedule used by this provider.
     *
     * @returns Provider draw schedule.
     */
    public get drawDays(): DrawDays {
        return this._drawDays;
    }

    /**
     * Draw-day refresh threshold.
     *
     * @returns A `Date` whose time component represents the refresh threshold.
     */
    public get drawDayRefreshTime(): Date {
        return this._drawDayRefreshTime;
    }

    /**
     * Combination factory used when rebuilding cached records.
     *
     * @returns Normalized combination factory.
     */
    public get combinationFactory(): CombinationFactory {
        return this._combinationFactory;
    }

    /**
     * Load cached records, refreshing data first when needed.
     *
     * @param force - Whether to force a refresh before loading.
     * @returns Cached draw records.
     */
    public async load(force = false): Promise<DrawRecord[]> {
        await this._refreshIfNeeded(force);
        return await (await this._getDataCache()).load();
    }

    /**
     * Load the raw cached CSV rows.
     *
     * @param force - Whether to force a refresh before loading.
     * @returns Raw cached rows.
     */
    public async loadRaw(force = false): Promise<Record<string, unknown>[]> {
        await this._refreshIfNeeded(force);
        const raw = await (await this._getDataCache()).loadRaw();
        return Array.isArray(raw) ? raw.filter(isRecord) : [];
    }

    /**
     * Refresh the provider cache and manifest.
     *
     * @param force - Whether to force a manifest and archive refresh.
     */
    public async refresh(force = false): Promise<void> {
        const manifestCache = await this._getManifestCache();
        let manifest = await manifestCache.load(force);

        if (manifest.length > 0 && manifest.some(entry => !entry.count)) {
            manifest = [];
        }

        let refreshed = false;

        if (force || manifest.length === 0) {
            manifest = await this._loadManifest(force);
            refreshed = true;
        } else {
            refreshed = (await this._checkArchives(manifest)) || refreshed;
            refreshed = (await this._checkArchiveChain(manifest)) || refreshed;
            refreshed = (await this._checkLastArchive(manifest)) || refreshed;
        }

        const cache = await this._getDataCache();
        if (refreshed || !(await cache.exists())) {
            await this._buildCache(manifest);
        }

        this._refreshTimeout.start();
    }

    protected async _refreshIfNeeded(force = false): Promise<void> {
        if (force || (await this._needRefresh())) {
            await this.refresh(force);
        }
    }

    protected async _needRefresh(): Promise<boolean> {
        const cache = await this._getDataCache();
        if (!(await cache.exists())) {
            return true;
        }

        if (this._refreshTimeout.started && !this._refreshTimeout.expired) {
            return false;
        }

        const cacheDate = await cache.date();
        const lastDrawDate = this._drawDays.get_last_draw_date(undefined, true);
        if (cacheDate < combineDateAndTime(lastDrawDate, this._drawDayRefreshTime)) {
            return true;
        }

        const records = await cache.load();
        if (records.length === 0) {
            return true;
        }

        const lastRecord = records.at(-1);
        if (!lastRecord) {
            return true;
        }

        const expectedLastDrawDate = toLocalDateKey(this._drawDays.get_last_draw_date(undefined, false));
        return toUtcDateKey(lastRecord.drawDate) < expectedLastDrawDate;
    }

    protected async _loadManifest(force: boolean): Promise<Manifest> {
        const archives = await this._resolver.load(force);
        const manifest: Manifest = [];

        for (const [name, url] of Object.entries(archives)) {
            manifest.push(await this._refreshArchive(name, url, force));
        }

        await (await this._getManifestCache()).set(manifest);
        return manifest;
    }

    protected async _refreshArchive(name: string, url: string, force = false): Promise<ArchiveInfo> {
        const sourcePath = await this._getSourcePath(name);
        const sourceFile = new File(sourcePath, { fileType: FileType.TEXT });

        if (force || !(await sourceFile.exists()) || (await sourceFile.size()) === 0) {
            await ensureDirectory(sourcePath);
            await this._loadSource(url, sourcePath);
            force = true;
        }

        const archivePath = await this._getArchivePath(name);
        const archiveFile = new File(archivePath);

        if (force || !(await archiveFile.exists()) || (await archiveFile.size()) === 0) {
            await ensureDirectory(archivePath);
            await this._parseSource(sourcePath, archivePath);
        }

        return {
            name,
            url,
            ...(await this._parseArchive(archivePath))
        };
    }

    protected async _checkArchives(manifest: Manifest): Promise<boolean> {
        const archives = await this._resolver.load();
        const resolverEntries = Object.entries(archives);
        if (resolverEntries.length === 0) {
            return false;
        }

        const manifestNames = new Set(manifest.map(archive => archive.name));
        let updated = false;

        for (const [name, url] of resolverEntries) {
            if (manifestNames.has(name)) {
                continue;
            }

            manifest.push(await this._refreshArchive(name, url, true));
            updated = true;
        }

        if (updated) {
            await (await this._getManifestCache()).set(manifest);
        }

        return updated;
    }

    protected async _checkArchiveChain(manifest: Manifest): Promise<boolean> {
        if (manifest.length <= 1) {
            return false;
        }

        manifest.sort((left, right) => (left.last_date ?? '').localeCompare(right.last_date ?? ''));

        const previousArchive = manifest.at(-2);
        const latestArchive = manifest.at(-1);

        if (!previousArchive?.last_date || !latestArchive?.first_date) {
            return false;
        }

        const lastKnownDate = parseLocalIsoDate(previousArchive.last_date);
        const expectedNextDate = this._drawDays.get_next_draw_date(lastKnownDate, false);
        const actualNextDate = parseLocalIsoDate(latestArchive.first_date);

        if (toLocalDateKey(expectedNextDate) === toLocalDateKey(actualNextDate)) {
            return false;
        }

        manifest[manifest.length - 2] = await this._refreshArchive(previousArchive.name, previousArchive.url, true);
        await (await this._getManifestCache()).set(manifest);
        return true;
    }

    protected async _checkLastArchive(manifest: Manifest): Promise<boolean> {
        if (manifest.length === 0) {
            return false;
        }

        manifest.sort((left, right) => (left.last_date ?? '').localeCompare(right.last_date ?? ''));

        const latestArchive = manifest.at(-1);
        if (!latestArchive) {
            return false;
        }

        const refreshOnCurrentDrawDay = getTimeValue(new Date()) >= getTimeValue(this._drawDayRefreshTime);
        const lastDrawDate = toLocalDateKey(this._drawDays.get_last_draw_date(undefined, refreshOnCurrentDrawDay));

        if (latestArchive.last_date === lastDrawDate) {
            return false;
        }

        manifest[manifest.length - 1] = await this._refreshArchive(latestArchive.name, latestArchive.url, true);
        await (await this._getManifestCache()).set(manifest);
        return true;
    }

    protected async _buildCache(manifest: Manifest): Promise<void> {
        const records: DrawRecord[] = [];

        for (const archive of manifest) {
            const archivePath = await this._getArchivePath(archive.name);
            const archiveFile = new File(archivePath);
            if (!(await archiveFile.exists())) {
                continue;
            }

            const period = archive.period ?? 'unknown';
            const lines = await this._readCsvRows(archivePath);
            for (const line of lines) {
                records.push(this._loadRecord({ ...line, period }));
            }
        }

        records.sort((left, right) => left.drawDate.getTime() - right.drawDate.getTime());
        await (await this._getDataCache()).set(records);
    }

    protected _loadRecord(data: Record<string, unknown>): DrawRecord {
        return DrawRecord.fromDict(data, this._combinationFactory);
    }

    protected _loadRecordList(data: Record<string, unknown>[] | null): DrawRecord[] {
        if (!Array.isArray(data)) {
            return [];
        }

        return data.filter(isRecord).map(record => this._loadRecord(record));
    }

    protected async _loadSource(url: string, path: string): Promise<void> {
        const content = await fetchContent(url, { binary: true });
        const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
        const text = isZipContent(bytes)
            ? ((await readZipFile(bytes, { ext: '.csv', encoding: DEFAULT_ENCODING })) as string)
            : new TextDecoder(DEFAULT_ENCODING).decode(bytes);

        await new File(path, { fileType: FileType.TEXT }).write(text);
    }

    protected async _parseSource(sourcePath: string, archivePath: string): Promise<void> {
        const rows = await this._readCsvRows(sourcePath);
        const records = rows.map(row => this._parser.parse(row).toDict());
        await new File(archivePath).write(records);
    }

    protected async _parseArchive(archivePath: string): Promise<Omit<ArchiveInfo, 'name' | 'url'>> {
        let firstDate: string | null = null;
        let lastDate: string | null = null;
        let count = 0;

        for (const line of await this._readCsvRows(archivePath)) {
            count += 1;
            const drawDate = typeof line.draw_date === 'string' ? line.draw_date : null;

            if (!drawDate) {
                continue;
            }

            if (firstDate === null || drawDate < firstDate) {
                firstDate = drawDate;
            }

            if (lastDate === null || drawDate > lastDate) {
                lastDate = drawDate;
            }
        }

        return {
            count,
            period: firstDate ? `${firstDate.slice(0, 4)}${firstDate.slice(5, 7)}` : null,
            first_date: firstDate,
            last_date: lastDate
        };
    }

    private async _getCacheDirectory(): Promise<string> {
        this._cachePathPromise ??= getCachePath(this._cacheRootName, true).then(rootPath =>
            normalizePath(rootPath, this._cacheName)
        );

        return await this._cachePathPromise;
    }

    private async _getManifestCache(): Promise<FileCache<unknown, Manifest>> {
        if (this._manifest) {
            return this._manifest;
        }

        this._manifest = new FileCache<unknown, Manifest>(
            normalizePath(await this._getCacheDirectory(), BaseProvider.MANIFEST_FILE_NAME),
            {
                transformer: manifest => normalizeManifest(manifest)
            }
        );

        return this._manifest;
    }

    private async _getDataCache(): Promise<FileCache<Record<string, unknown>[], DrawRecord[]>> {
        if (this._cache) {
            return this._cache;
        }

        this._cache = new FileCache<Record<string, unknown>[], DrawRecord[]>(
            normalizePath(await this._getCacheDirectory(), BaseProvider.DATA_FILE_NAME),
            {
                transformer: data => this._loadRecordList(Array.isArray(data) ? data.filter(isRecord) : null)
            }
        );

        return this._cache;
    }

    private async _getSourcePath(name: string): Promise<string> {
        return normalizePath(await this._getCacheDirectory(), BaseProvider.SOURCE_DIR_NAME, `${name}.csv`);
    }

    private async _getArchivePath(name: string): Promise<string> {
        return normalizePath(await this._getCacheDirectory(), BaseProvider.ARCHIVE_DIR_NAME, `${name}.csv`);
    }

    private async _readCsvRows(path: string): Promise<Record<string, string>[]> {
        const content = await new File(path, { fileType: FileType.TEXT }).read({ throwOnError: false });
        if (typeof content !== 'string' || content.length === 0) {
            return [];
        }

        return Array.from(readCsvFile(content, { dialect: 'excel' })).filter((line): line is Record<string, string> =>
            isRecord(line)
        );
    }
}
