import { describe, expect, it, vi } from 'vitest';

import { TimeoutCache } from 'src/utils/index.ts';

describe('TimeoutCache', () => {
    it('initializes with default timeout', () => {
        const cache = new TimeoutCache({ loader: () => ({ value: 1 }) });

        expect(cache.timeout).toBe(TimeoutCache.DEFAULT_CACHE_TIMEOUT);
        expect(cache.loaded).toBe(false);
        expect(cache.expired).toBe(false);
    });

    it('supports custom timeout', () => {
        const cache = new TimeoutCache({
            loader: () => ({ value: 1 }),
            cacheTimeout: 10
        });

        expect(cache.timeout).toBe(10);
    });

    it('supports timeout setter', () => {
        const cache = new TimeoutCache({ loader: () => ({ value: 1 }) });

        cache.timeout = 12;

        expect(cache.timeout).toBe(12);
    });

    it('loads and caches data until expiration', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        let callCount = 0;
        const cache = new TimeoutCache({
            cacheTimeout: 0.1,
            loader: () => {
                callCount += 1;
                return { value: callCount };
            }
        });

        const first = await cache.load();
        const second = await cache.load();

        vi.advanceTimersByTime(150);
        const third = await cache.load();

        expect(first).toEqual({ value: 1 });
        expect(second).toEqual({ value: 1 });
        expect(third).toEqual({ value: 2 });
        expect(callCount).toBe(2);

        vi.useRealTimers();
    });

    it('force refreshes before expiration', async () => {
        let callCount = 0;
        const cache = new TimeoutCache({
            loader: () => {
                callCount += 1;
                return { value: callCount };
            }
        });

        await cache.load();
        await cache.load(true);

        expect(callCount).toBe(2);
    });

    it('tracks cache age', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const cache = new TimeoutCache({
            loader: () => ({ value: 1 }),
            cacheTimeout: 10
        });

        await cache.load();
        const firstAge = cache.age;
        vi.advanceTimersByTime(100);
        const secondAge = cache.age;

        expect(firstAge).toBe(0);
        expect(secondAge).toBeGreaterThan(firstAge);

        vi.useRealTimers();
    });

    it('clear resets timeout and loaded state', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const cache = new TimeoutCache({
            loader: () => ({ value: 1 }),
            cacheTimeout: 0.1
        });

        await cache.load();
        vi.advanceTimersByTime(150);

        expect(cache.expired).toBe(true);

        await cache.clear();

        expect(cache.loaded).toBe(false);
        expect(cache.expired).toBe(false);

        vi.useRealTimers();
    });

    it('set updates data and restarts timeout', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const cache = new TimeoutCache({
            loader: () => ({ value: 1 }),
            cacheTimeout: 0.1
        });

        await cache.load();
        vi.advanceTimersByTime(150);
        expect(cache.expired).toBe(true);

        await cache.set({ value: 2 });

        expect(cache.data).toEqual({ value: 2 });
        expect(cache.expired).toBe(false);

        vi.useRealTimers();
    });

    it('applies transformer and keeps loadRaw untransformed', async () => {
        const cache = new TimeoutCache({
            cacheTimeout: 10,
            loader: () => ({ value: 3 }),
            transformer: data => ({ value: data.value * 2 })
        });

        expect(await cache.loadRaw()).toEqual({ value: 3 });
        expect(await cache.load()).toEqual({ value: 6 });
    });

    it('supports initial data and delayed refresh', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        let callCount = 0;
        const cache = new TimeoutCache({
            data: { value: 0 },
            cacheTimeout: 0.1,
            loader: () => {
                callCount += 1;
                return { value: callCount };
            }
        });

        expect(cache.loaded).toBe(true);
        expect(cache.data).toEqual({ value: 0 });

        vi.advanceTimersByTime(150);

        expect(await cache.load()).toEqual({ value: 1 });

        vi.useRealTimers();
    });
});
