import { describe, expect, it } from 'vitest';

import { MemoryCache } from 'src/utils/index.ts';

class TestableCache<T> extends MemoryCache<T> {
    private readonly readValue: T;

    public readCalls = 0;

    public writeCalls: T[] = [];

    public clearCalls = 0;

    public shouldRefresh = true;

    public constructor(readValue: T, data?: T) {
        super({ data });
        this.readValue = readValue;
    }

    protected override _refreshCondition(): boolean {
        return this.shouldRefresh;
    }

    protected override async _read(): Promise<T> {
        this.readCalls += 1;
        return this.readValue;
    }

    protected override async _write(data: T): Promise<void> {
        this.writeCalls.push(data);
        await super._write(data);
    }

    protected override async _clear(): Promise<void> {
        this.clearCalls += 1;
        await super._clear();
    }
}

describe('MemoryCache', () => {
    it('initializes empty and unloaded by default', () => {
        const cache = new MemoryCache();

        expect(cache.data).toBeUndefined();
        expect(cache.loaded).toBe(false);
    });

    it('marks cache as loaded when initialized with data', () => {
        const cache = new MemoryCache({ data: { value: 1 } });

        expect(cache.data).toEqual({ value: 1 });
        expect(cache.loaded).toBe(true);
    });

    it('set updates data and loaded flag', async () => {
        const cache = new TestableCache({ value: 1 });

        await cache.set({ value: 2 });

        expect(cache.data).toEqual({ value: 2 });
        expect(cache.loaded).toBe(true);
        expect(cache.writeCalls).toEqual([{ value: 2 }]);
    });

    it('load refreshes using _read when needed', async () => {
        const cache = new TestableCache({ value: 1 });

        const result = await cache.load();

        expect(result).toEqual({ value: 1 });
        expect(cache.readCalls).toBe(1);
        expect(cache.loaded).toBe(true);
    });

    it('load returns existing data when refresh is not needed', async () => {
        const cache = new TestableCache({ value: 2 }, { value: 1 });
        cache.shouldRefresh = false;

        const result = await cache.load();

        expect(result).toEqual({ value: 1 });
        expect(cache.readCalls).toBe(0);
    });

    it('force load bypasses refresh condition', async () => {
        const cache = new TestableCache({ value: 2 }, { value: 1 });
        cache.shouldRefresh = false;

        const result = await cache.load(true);

        expect(result).toEqual({ value: 2 });
        expect(cache.readCalls).toBe(1);
    });

    it('clear resets cache and loaded flag', async () => {
        const cache = new TestableCache({ value: 1 }, { value: 1 });

        await cache.clear();

        expect(cache.data).toBeUndefined();
        expect(cache.loaded).toBe(false);
        expect(cache.clearCalls).toBe(1);
    });

    it('loader is called only on refresh', async () => {
        let callCount = 0;
        const cache = new MemoryCache({
            loader: () => {
                callCount += 1;
                return { call: callCount };
            }
        });

        const first = await cache.load();
        const second = await cache.load();
        const forced = await cache.load(true);

        expect(first).toEqual({ call: 1 });
        expect(second).toEqual({ call: 1 });
        expect(forced).toEqual({ call: 2 });
        expect(callCount).toBe(2);
    });

    it('applies transformer on load but not on loadRaw', async () => {
        let transformCalls = 0;
        const cache = new MemoryCache({
            loader: () => ({ value: 2 }),
            transformer: data => {
                transformCalls += 1;
                return { value: data.value * 3 };
            }
        });

        const raw = await cache.loadRaw();
        const loaded = await cache.load();

        expect(raw).toEqual({ value: 2 });
        expect(loaded).toEqual({ value: 6 });
        expect(transformCalls).toBe(1);
    });

    it('falls back when loader/transformer are not callable', async () => {
        const cache = new MemoryCache({
            loader: 'invalid' as unknown as () => unknown,
            transformer: 'invalid' as unknown as (value: unknown) => unknown
        });

        expect(await cache.load()).toBeUndefined();
    });
});
