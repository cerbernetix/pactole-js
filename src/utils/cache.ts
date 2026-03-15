import { File, FileType } from './file.ts';
import { Timeout } from './timeout.ts';

type MaybePromise<T> = T | Promise<T>;

/**
 * Async or sync function that loads raw source data.
 *
 * Used as the `loader` hook passed to cache constructors.
 */
export type CacheLoader<T> = () => MaybePromise<T>;

/**
 * Async or sync function that transforms raw source data into the cached form.
 *
 * Used as the `transformer` hook passed to cache constructors.
 */
export type CacheTransformer<TInput, TOutput> = (data: TInput) => MaybePromise<TOutput>;

/**
 * Constructor options for {@link MemoryCache}.
 */
export interface MemoryCacheOptions<TInput, TOutput = TInput> {
    /** Pre-seeded data. When provided the cache is considered already loaded. */
    data?: TOutput;
    /** Function called to fetch fresh source data. Receives no arguments and may return a promise. */
    loader?: CacheLoader<TInput>;
    /**
     * Optional transformation applied to the raw value returned by `loader` before
     * it is stored. Allows the cached type to differ from the source type.
     */
    transformer?: CacheTransformer<TInput, TOutput>;
}

/**
 * In-memory cache with optional loader and transformer hooks.
 *
 * Data is fetched through the `loader` the first time {@link load} is called (or
 * whenever the internal {@link _refreshCondition} returns `true`). Subsequent
 * calls return the in-memory value. The optional `transformer` converts the raw
 * loader output before it is stored.
 *
 * Subclasses can override `_refreshCondition`, `_read`, `_write`, and `_clear`
 * to add expiration, persistence, or other custom behaviours.
 *
 * @example
 * ```ts
 * const cache = new MemoryCache({ loader: () => fetch('/api/data').then(r => r.json()) });
 * const data = await cache.load();       // fetches and stores
 * const again = await cache.load();     // returns cached value
 * await cache.clear();                   // resets state
 * ```
 */
export class MemoryCache<TInput = unknown, TOutput = TInput> {
    protected _cache: TOutput | undefined;

    protected _loaded: boolean;

    protected readonly _loader: CacheLoader<TInput>;

    protected readonly _transformer: CacheTransformer<TInput, TOutput>;

    /**
     * Create a new `MemoryCache` instance.
     *
     * @param options - Optional loader, transformer, and pre-seeded data.
     */
    public constructor(options: MemoryCacheOptions<TInput, TOutput> = {}) {
        this._cache = options.data;
        this._loaded = options.data !== undefined;
        this._loader = typeof options.loader === 'function' ? options.loader : () => undefined as TInput;
        this._transformer =
            typeof options.transformer === 'function' ? options.transformer : value => value as unknown as TOutput;
    }

    /**
     * The currently cached value, or `undefined` when the cache has not been loaded yet.
     */
    public get data(): TOutput | undefined {
        return this._cache;
    }

    /**
     * Whether the cache has been loaded at least once.
     */
    public get loaded(): boolean {
        return this._loaded;
    }

    /**
     * Directly store a value in the cache, bypassing the loader.
     *
     * Marks the cache as loaded and delegates persistence to {@link _write}.
     *
     * @param data - The value to store.
     */
    public async set(data: TOutput): Promise<void> {
        await this._write(data);
        this._loaded = true;
    }

    /**
     * Return the cached value, refreshing it first when the refresh condition is met.
     *
     * @param force - When `true`, the loader is always called regardless of the
     *   refresh condition. Default is `false`.
     * @returns The cached (and potentially freshly loaded) value.
     */
    public async load(force = false): Promise<TOutput> {
        if (force || this._refreshCondition()) {
            this._cache = await this._read();
            this._loaded = true;
        }

        return this._cache as TOutput;
    }

    /**
     * Invoke the loader directly and return the raw source data, without applying
     * the transformer or updating the cache state.
     *
     * @returns The raw value produced by the loader.
     */
    public async loadRaw(): Promise<TInput> {
        return await this._loader();
    }

    /**
     * Reset the cache to its initial unloaded state.
     *
     * Delegates the actual reset to {@link _clear} and then sets `loaded` to `false`.
     */
    public async clear(): Promise<void> {
        await this._clear();
        this._loaded = false;
    }

    protected _refreshCondition(): boolean {
        return !this._loaded;
    }

    protected async _read(): Promise<TOutput> {
        return await this._transformer(await this._loader());
    }

    protected async _write(data: TOutput): Promise<void> {
        this._cache = data;
    }

    protected async _clear(): Promise<void> {
        this._cache = undefined;
    }
}

/**
 * Constructor options for {@link TimeoutCache}.
 */
export interface TimeoutCacheOptions<TInput, TOutput = TInput> extends MemoryCacheOptions<TInput, TOutput> {
    /**
     * How long the cached value remains valid, in seconds.
     * Default is {@link TimeoutCache.DEFAULT_CACHE_TIMEOUT}.
     */
    cacheTimeout?: number;
}

/**
 * In-memory cache that automatically expires after a configurable timeout.
 *
 * Extends {@link MemoryCache} with a {@link Timeout} so that the cached value
 * is considered stale once the timeout duration has elapsed since the last
 * successful load. A forced reload or a call to {@link set} resets the clock.
 *
 * @example
 * ```ts
 * const cache = new TimeoutCache({
 *     cacheTimeout: 300, // 5 minutes
 *     loader: () => fetch('/api/data').then(r => r.json()),
 * });
 * const data = await cache.load();
 * console.log(cache.expired); // false (immediately after load)
 * ```
 */
export class TimeoutCache<TInput = unknown, TOutput = TInput> extends MemoryCache<TInput, TOutput> {
    /** Default timeout duration in seconds (1 hour). */
    public static readonly DEFAULT_CACHE_TIMEOUT = 3600;

    private readonly _timeout: Timeout;

    /**
     * Create a new `TimeoutCache` instance.
     *
     * @param options - Loader, transformer, pre-seeded data, and timeout options.
     */
    public constructor(options: TimeoutCacheOptions<TInput, TOutput> = {}) {
        const { cacheTimeout = TimeoutCache.DEFAULT_CACHE_TIMEOUT, ...memoryOptions } = options;
        super(memoryOptions);
        this._timeout = new Timeout(cacheTimeout, options.data !== undefined);
    }

    /**
     * Cache timeout duration in seconds.
     *
     * Updating this value takes effect on the next expiration check.
     */
    public get timeout(): number {
        return this._timeout.seconds;
    }

    public set timeout(value: number) {
        this._timeout.seconds = value;
    }

    /**
     * Elapsed time in seconds since the last successful load or {@link set} call.
     *
     * Returns `0` when the cache has never been loaded.
     */
    public get age(): number {
        return this._timeout.elapsed;
    }

    /**
     * Whether the cached value has exceeded the configured timeout and should be
     * refreshed on the next {@link load} call.
     */
    public get expired(): boolean {
        return this._timeout.expired;
    }

    protected override _refreshCondition(): boolean {
        return super._refreshCondition() || this._timeout.expired;
    }

    protected override async _read(): Promise<TOutput> {
        const data = await super._read();
        this._timeout.start();
        return data;
    }

    protected override async _write(data: TOutput): Promise<void> {
        await super._write(data);
        this._timeout.start();
    }

    protected override async _clear(): Promise<void> {
        this._cache = undefined;
        this._timeout.stop();
    }
}

/**
 * Constructor options for {@link FileCache}.
 */
export interface FileCacheOptions<TInput, TOutput = TInput> {
    /**
     * Explicit file type override for the backing file.
     *
     * Accepts a `FileType` constant, extension string, or dotted extension.
     * When omitted the type is inferred from the file path extension.
     */
    fileType?: FileType | string;
    /**
     * Optional transformation applied to the raw value loaded from the backing
     * file before it is stored in memory. Receives `null` when the file is absent.
     */
    transformer?: CacheTransformer<TInput | null, TOutput>;
    /** Text encoding used when reading and writing the backing file. Default is `'utf-8'`. */
    encoding?: string;
}

/**
 * Cache implementation backed by the shared runtime {@link File} abstraction.
 *
 * On every refresh the backing file is read and its content is passed through
 * the optional transformer. Writing via {@link set} persists the value to the
 * file. Calling {@link clear} deletes the backing file and resets in-memory
 * state.
 *
 * Read failures (missing file, parse errors) are swallowed and surfaced as
 * `null` to the transformer so the caller can decide on a safe fallback.
 *
 * @example
 * ```ts
 * const cache = new FileCache<Record<string, unknown>>('/tmp/pactole/data.json');
 * await cache.set({ key: 'value' });
 * const data = await cache.load(); // { key: 'value' }
 * await cache.clear();              // deletes the file
 * ```
 */
export class FileCache<TInput = unknown, TOutput = TInput> extends MemoryCache<TInput | null, TOutput> {
    private readonly _file: File;

    /**
     * Create a new `FileCache` instance.
     *
     * @param filePath - Path to the backing file. The file type is inferred from
     *   the extension unless overridden in `options`.
     * @param options - File type, encoding, and transformer options.
     */
    public constructor(filePath: string, options: FileCacheOptions<TInput, TOutput> = {}) {
        const fileRef: { current: File | null } = { current: null };
        super({
            loader: async () => (await fileRef.current?.read({ throwOnError: false })) as TInput | null,
            transformer: options.transformer
        });
        fileRef.current = new File(filePath, {
            fileType: options.fileType,
            encoding: options.encoding
        });
        this._file = fileRef.current;
    }

    /**
     * Absolute or logical path of the backing file.
     */
    public get path(): string {
        return this._file.path;
    }

    /**
     * Resolved {@link FileType} of the backing file.
     */
    public get type(): FileType {
        return this._file.type;
    }

    /**
     * Return whether the backing file exists in the underlying storage.
     *
     * @returns `true` when the file exists.
     */
    public async exists(): Promise<boolean> {
        return await this._file.exists();
    }

    /**
     * Return the last modification date of the backing file.
     *
     * @returns The modification `Date`.
     * @throws When the file does not exist or the adapter cannot stat the path.
     */
    public async date(): Promise<Date> {
        return await this._file.date();
    }

    /**
     * Return the backing file size in bytes.
     *
     * Returns `0` when the file does not exist.
     *
     * @returns The file size in bytes, or `0` if the file is absent.
     */
    public async size(): Promise<number> {
        return await this._file.size();
    }

    protected override async _write(data: TOutput): Promise<void> {
        await this._file.write(data, { throwOnError: false });
        await super._write(data);
    }

    protected override async _clear(): Promise<void> {
        await this._file.delete({ throwOnError: false });
        await super._clear();
    }
}
