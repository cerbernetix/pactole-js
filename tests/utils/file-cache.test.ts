import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FileCache, FileType } from 'src/utils/index.ts';

import { tmpdir } from 'node:os';
import { join } from 'node:path';

let root = '';

describe('FileCache', () => {
    beforeAll(async () => {
        const fsModule = await import('node:fs/promises');
        root = await fsModule.mkdtemp(join(tmpdir(), 'pactole-file-cache-'));
    });

    afterAll(async () => {
        if (!root) {
            return;
        }

        const fsModule = await import('node:fs/promises');
        await fsModule.rm(root, { recursive: true, force: true });
    });

    const getPath = (name: string): string => join(root, `${name}-${Math.random().toString(36).slice(2)}.json`);

    it('infers type from extension', () => {
        expect(new FileCache(join(root, 'data.csv')).type).toBe(FileType.CSV);
        expect(new FileCache(join(root, 'data.json')).type).toBe(FileType.JSON);
        expect(new FileCache(join(root, 'data.log')).type).toBe(FileType.TEXT);
    });

    it('checks file existence', async () => {
        const cache = new FileCache(getPath('exists'));

        expect(await cache.exists()).toBe(false);

        await cache.set({ value: 1 });

        expect(await cache.exists()).toBe(true);
    });

    it('reports date and size', async () => {
        const cache = new FileCache(join(root, `meta-${Math.random().toString(36).slice(2)}.txt`));

        await cache.set('hello');

        expect(await cache.size()).toBe(5);
        expect(await cache.date()).toBeInstanceOf(Date);
    });

    it('loads missing file as null', async () => {
        const cache = new FileCache(getPath('missing'));

        expect(await cache.load()).toBeNull();
        expect(cache.data).toBeNull();
    });

    it('loads csv/json/text files', async () => {
        const suffix = Math.random().toString(36).slice(2);
        const csv = new FileCache(join(root, `rows-${suffix}.csv`));
        const json = new FileCache(join(root, `data-${suffix}.json`));
        const text = new FileCache(join(root, `note-${suffix}.txt`));

        await csv.set([
            { col1: '1', col2: '2' },
            { col1: '3', col2: '4' }
        ]);
        await json.set({ key: 'value' });
        await text.set('hello world');

        expect(await csv.load()).toEqual([
            { col1: '1', col2: '2' },
            { col1: '3', col2: '4' }
        ]);
        expect(await json.load()).toEqual({ key: 'value' });
        expect(await text.load()).toBe('hello world');
    });

    it('applies transformer on load but not loadRaw', async () => {
        const path = getPath('transform');
        const writer = new FileCache<{ items: number[] }>(path);
        const cache = new FileCache<{ items: number[]; count?: number }>(path, {
            transformer: data => ({
                items: data?.items ?? [],
                count: data?.items.length ?? 0
            })
        });

        await writer.set({ items: [1, 2, 3] });

        expect(await cache.loadRaw()).toEqual({ items: [1, 2, 3] });
        expect(await cache.load(true)).toEqual({ items: [1, 2, 3], count: 3 });
    });

    it('uses in-memory cache until forced reload', async () => {
        const path = getPath('forced');
        const cache = new FileCache<{ value: number }>(path);
        const writer = new FileCache<{ value: number }>(path);

        await cache.set({ value: 1 });
        await cache.load();

        await writer.set({ value: 2 });

        const second = await cache.load();
        const forced = await cache.load(true);

        expect(second).toEqual({ value: 1 });
        expect(forced).toEqual({ value: 2 });
    });

    it('clear removes backing file and cached value', async () => {
        const cache = new FileCache(getPath('clear'));

        await cache.set({ value: 1 });
        expect(await cache.exists()).toBe(true);

        await cache.clear();

        expect(cache.data).toBeUndefined();
        expect(await cache.exists()).toBe(false);
        expect(await cache.load()).toBeNull();
    });

    it('exposes backing path', () => {
        const path = getPath('path');
        const cache = new FileCache(path);

        expect(cache.path).toBe(path);
    });
});
