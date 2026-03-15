import { describe, expect, it } from 'vitest';

import { BaseResolver } from 'src/data/index.ts';
import { TimeoutCache } from 'src/utils/index.ts';

class SampleResolver extends BaseResolver {
    private readonly _loader: () => unknown;

    public constructor(loader: () => unknown, cacheTimeout = 3600) {
        super(cacheTimeout);
        this._loader = loader;
    }

    protected override _loadCache() {
        return this._loader() as Record<string, string>;
    }
}

describe('BaseResolver', () => {
    it('sets cache timeout at initialization', () => {
        const resolver = new SampleResolver(() => ({}), 12.5);

        expect(resolver.cache.timeout).toBe(12.5);
        expect(resolver.cache.loaded).toBe(false);
    });

    it('cache property returns the timeout cache instance', () => {
        const resolver = new SampleResolver(() => ({}));

        expect(resolver.cache).toBeInstanceOf(TimeoutCache);
        expect(resolver.cache).toBe(resolver.cache);
    });

    it('load returns archives', async () => {
        const data = { 'archive.zip': 'https://local.test/archive.zip' };
        const resolver = new SampleResolver(() => data);

        await expect(resolver.load()).resolves.toEqual(data);
        expect(resolver.cache.loaded).toBe(true);
    });

    it('force load refreshes cache', async () => {
        let callCount = 0;

        const resolver = new SampleResolver(() => {
            callCount += 1;
            return { 'archive.zip': `https://local.test/${callCount}.zip` };
        });

        const first = await resolver.load();
        const second = await resolver.load(true);

        expect(first).not.toEqual(second);
        expect(callCount).toBe(2);
    });

    it('resolve returns URL for known archive', async () => {
        const resolver = new SampleResolver(() => ({ 'archive.zip': 'https://local.test/archive.zip' }));

        await expect(resolver.resolve('archive.zip')).resolves.toBe('https://local.test/archive.zip');
    });

    it('resolve raises for unknown archive', async () => {
        const resolver = new SampleResolver(() => ({ 'archive.zip': 'https://local.test/archive.zip' }));

        await expect(resolver.resolve('missing.zip')).rejects.toThrow("Archive 'missing.zip' not found");
    });

    it('resolve raises for non-dictionary archives', async () => {
        const resolver = new SampleResolver(() => ['archive.zip']);

        await expect(resolver.resolve('archive.zip')).rejects.toThrow("Archive 'archive.zip' not found");
    });

    it('base resolver requires _loadCache implementation', async () => {
        const resolver = new BaseResolver();

        await expect(resolver.load()).rejects.toThrow('Subclasses must implement method _load_cache.');
    });
});
