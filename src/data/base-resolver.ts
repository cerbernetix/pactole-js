import { TimeoutCache } from '../utils/index.ts';

/** Archive URL map keyed by archive name. */
export type ArchiveMap = Record<string, string>;

/**
 * Base class for resolving available archives.
 *
 * @example
 * ```ts
 * class SampleResolver extends BaseResolver {
 *   protected override _loadCache(): ArchiveMap {
 *     return { 'archive.zip': 'https://local.test/archive.zip' };
 *   }
 * }
 *
 * const resolver = new SampleResolver();
 * const url = await resolver.resolve('archive.zip');
 * ```
 */
export class BaseResolver {
    protected readonly _cache: TimeoutCache<ArchiveMap, ArchiveMap>;

    /**
     * @param cacheTimeout - Cache lifetime in seconds.
     */
    public constructor(cacheTimeout: number = TimeoutCache.DEFAULT_CACHE_TIMEOUT) {
        this._cache = new TimeoutCache<ArchiveMap, ArchiveMap>({
            loader: () => this._loadCache(),
            cacheTimeout
        });
    }

    /**
     * Timeout cache instance used to memoize archive metadata.
     *
     * @returns Resolver cache instance.
     */
    public get cache(): TimeoutCache<ArchiveMap, ArchiveMap> {
        return this._cache;
    }

    /**
     * Resolve a URL from an archive name.
     *
     * @param name - Archive file name.
     * @param force - Whether to force cache refresh.
     * @returns Archive URL.
     * @throws {Error} Thrown when the archive name cannot be resolved.
     *
     * @example
     * ```ts
     * const url = await resolver.resolve('archive.zip');
     * ```
     */
    public async resolve(name: string, force = false): Promise<string> {
        const archives = await this.load(force);

        if (typeof archives !== 'object' || archives === null || Array.isArray(archives) || !(name in archives)) {
            throw new Error(`Archive '${name}' not found in available archives.`);
        }

        return archives[name] as string;
    }

    /**
     * Load available archive metadata.
     *
     * @param force - Whether to force cache refresh.
     * @returns Archive URL map.
     *
     * @example
     * ```ts
     * const archives = await resolver.load();
     * ```
     */
    public async load(force = false): Promise<ArchiveMap> {
        return await this._cache.load(force);
    }

    /**
     * Load archives from the backing source.
     *
     * @returns Archive URL map.
     * @throws {Error} Always, until implemented by subclasses.
     *
     * @example
     * ```ts
     * class CustomResolver extends BaseResolver {
     *   protected override _loadCache(): ArchiveMap {
     *     return {};
     *   }
     * }
     * ```
     */
    protected _loadCache(): ArchiveMap | Promise<ArchiveMap> {
        throw new Error('Subclasses must implement method _load_cache.');
    }
}
