import { strToU8, zipSync } from 'fflate';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
    CACHE_PATH,
    CSV_MAX_TRIES,
    CSV_SAMPLE_SIZE,
    EnhancedJSONEncoder,
    FileType,
    createFileAdapter,
    ensureDirectory,
    fetchContent,
    getCachePath,
    getFileType,
    isZipContent,
    readCsvFile,
    readZipFile,
    writeCsvFile,
    writeJsonFile
} from 'src/utils/index.ts';

import { tmpdir } from 'node:os';
import { join } from 'node:path';

let tempRoot = '';

const makePath = (...parts: string[]): string => join(tempRoot, ...parts);

describe('file utilities', () => {
    beforeAll(async () => {
        const fsModule = await import('node:fs/promises');
        tempRoot = await fsModule.mkdtemp(join(tmpdir(), 'pactole-file-utils-'));
    });

    afterAll(async () => {
        if (!tempRoot) {
            return;
        }

        const fsModule = await import('node:fs/promises');
        await fsModule.rm(tempRoot, { recursive: true, force: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('ensures parent directory exists', async () => {
        const target = makePath('deep', 'data.txt');

        await ensureDirectory(target);

        const fsModule = await import('node:fs/promises');
        const pathModule = await import('node:path');
        const stats = await fsModule.stat(pathModule.dirname(target));

        expect(stats.isDirectory()).toBe(true);
    });

    it('returns cache base path by default', async () => {
        const path = await getCachePath();

        expect(path.length).toBeGreaterThan(0);
        expect(path.endsWith('.cache') || path.endsWith(CACHE_PATH)).toBe(true);
    });

    it('normalizes nested cache folders', async () => {
        const path = await getCachePath('../../data/sub', false);

        expect(path).toContain('data');
        expect(path).toContain('sub');
    });

    it('supports browser-style cache path resolution when process is unavailable', async () => {
        vi.stubGlobal('process', undefined);

        const path = await getCachePath('../client/cache//', false);

        expect(path).toContain('.cache/client/cache');
    });

    it('treats process polyfills as non-node runtimes for cache path resolution', async () => {
        vi.stubGlobal('process', {
            versions: { node: '20.0.0' },
            release: { name: 'browser' }
        });

        const path = await getCachePath('../client/cache//', false);

        expect(path).toContain('.cache/client/cache');
    });

    it('no-ops ensureDirectory when process is unavailable', async () => {
        vi.stubGlobal('process', undefined);

        await expect(ensureDirectory('/virtual/path/file.txt')).resolves.toBeUndefined();
    });

    it('creates cache folder when requested', async () => {
        const folder = `pactole-cache-${Math.random().toString(36).slice(2)}`;
        const path = await getCachePath(folder, true);
        const fsModule = await import('node:fs/promises');
        const stats = await fsModule.stat(path);

        expect(stats.isDirectory()).toBe(true);

        await fsModule.rm(path, { recursive: true, force: true });
    });

    it('fetches text content', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response('hello world', {
                status: 200,
                headers: {
                    'content-type': 'text/plain'
                }
            })
        );

        const result = await fetchContent('https://local.test/data.txt');

        expect(result).toBe('hello world');
        expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it('aborts fetch request when timeout is reached', async () => {
        vi.useFakeTimers();
        vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
            const signal = init?.signal;
            return new Promise<Response>((_resolve, reject) => {
                signal?.addEventListener('abort', () => reject(new Error('aborted')));
            });
        });

        const assertion = expect(fetchContent('https://local.test/slow.txt', { timeout: 0.001 })).rejects.toThrow(
            /aborted/u
        );
        await vi.advanceTimersByTimeAsync(20);

        await assertion;
        vi.useRealTimers();
    });

    it('fetches binary content', async () => {
        const bytes = new Uint8Array([1, 2, 3]);
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(bytes, {
                status: 200,
                headers: {
                    'content-type': 'application/octet-stream'
                }
            })
        );

        const result = await fetchContent('https://local.test/image.png', { binary: true });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result as Uint8Array)).toEqual([1, 2, 3]);
    });

    it('throws when fetch response is not ok', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('failure', { status: 500 }));

        await expect(fetchContent('https://local.test/failure.txt')).rejects.toThrow(/Failed to fetch content/u);
    });

    it('reads a zip entry by filename', async () => {
        const bytes = zipSync({
            'data.txt': strToU8('hello zip')
        });

        const result = await readZipFile(bytes, { filename: 'data.txt', encoding: 'utf-8' });

        expect(result).toBe('hello zip');
    });

    it('reads a zip entry by extension', async () => {
        const bytes = zipSync({
            'data.csv': strToU8('a,b\n1,2\n')
        });

        const result = await readZipFile(bytes, { ext: '.csv', encoding: 'utf-8' });

        expect(result).toBe('a,b\n1,2\n');
    });

    it('reads zip content when input is an ArrayBuffer', async () => {
        const bytes = zipSync({
            'data.txt': strToU8('arraybuffer zip')
        });
        const asArrayBuffer = Uint8Array.from(bytes).buffer;

        const result = await readZipFile(asArrayBuffer, { filename: 'data.txt', encoding: 'utf-8' });

        expect(result).toBe('arraybuffer zip');
    });

    it('reads first zip entry when no filename or extension is provided', async () => {
        const bytes = zipSync({
            'first.txt': strToU8('first'),
            'second.txt': strToU8('second')
        });

        const result = await readZipFile(bytes, { encoding: 'utf-8' });

        expect(result).toBe('first');
    });

    it('returns raw bytes when no zip text encoding is requested', async () => {
        const bytes = zipSync({
            'data.bin': new Uint8Array([4, 5, 6])
        });

        const result = await readZipFile(bytes, { filename: 'data.bin' });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result as Uint8Array)).toEqual([4, 5, 6]);
    });

    it('supports strict zip decoding errors', async () => {
        const bytes = zipSync({
            'bad.bin': new Uint8Array([0xff, 0xff])
        });

        await expect(
            readZipFile(bytes, {
                filename: 'bad.bin',
                encoding: 'utf-8',
                decodingErrors: 'strict'
            })
        ).rejects.toThrow();
    });

    it('supports replace zip decoding errors mode', async () => {
        const bytes = zipSync({
            'bad.bin': new Uint8Array([0xff])
        });

        const result = await readZipFile(bytes, {
            filename: 'bad.bin',
            encoding: 'utf-8',
            decodingErrors: 'replace'
        });

        expect(result).toContain('\uFFFD');
    });

    it('uses replace mode in catch branch when decode throws', async () => {
        const bytes = zipSync({
            'bad.bin': new Uint8Array([0x31])
        });

        const OriginalTextDecoder = globalThis.TextDecoder;
        let calls = 0;
        class FlakyTextDecoder {
            public constructor() {
                // noop
            }

            public decode(): string {
                calls += 1;
                if (calls === 1) {
                    throw new Error('decode failed');
                }
                return 'recovered';
            }
        }

        vi.stubGlobal('TextDecoder', FlakyTextDecoder as unknown as typeof TextDecoder);

        const result = await readZipFile(bytes, {
            filename: 'bad.bin',
            encoding: 'utf-8',
            decodingErrors: 'replace'
        });

        expect(result).toBe('recovered');
        vi.stubGlobal('TextDecoder', OriginalTextDecoder);
    });

    it('rethrows non-replace zip decoding errors', async () => {
        const bytes = zipSync({
            'payload.txt': strToU8('content')
        });

        await expect(
            readZipFile(bytes, {
                filename: 'payload.txt',
                encoding: 'unknown-encoding',
                decodingErrors: 'ignore'
            })
        ).rejects.toThrow();
    });

    it('throws when zip entry is missing', async () => {
        const bytes = zipSync({
            'data.txt': strToU8('content')
        });

        await expect(readZipFile(bytes, { filename: 'missing.txt' })).rejects.toThrow(/does not exist in the archive/u);
    });

    it('detects zip signatures for valid content', () => {
        const bytes = zipSync({
            'data.txt': strToU8('zip')
        });
        const asArrayBuffer = Uint8Array.from(bytes).buffer;

        expect(isZipContent(bytes)).toBe(true);
        expect(isZipContent(asArrayBuffer)).toBe(true);
    });

    it('detects non-zip content', () => {
        expect(isZipContent(new Uint8Array([0x00, 0x01, 0x02, 0x03]))).toBe(false);
        expect(isZipContent(new Uint8Array([0x50, 0x4b, 0x03]))).toBe(false);
    });

    it('reads csv with headers', () => {
        const rows = Array.from(readCsvFile('col1,col2\n1,2\n3,4\n', { dialect: 'excel' }));

        expect(rows).toEqual([
            { col1: '1', col2: '2' },
            { col1: '3', col2: '4' }
        ]);
    });

    it('reads csv with headers and semicolon delimiter', () => {
        const rows = Array.from(readCsvFile('col1;col2\n1;2\n3;4\n'));

        expect(rows).toEqual([
            { col1: '1', col2: '2' },
            { col1: '3', col2: '4' }
        ]);
    });

    it('reads csv without headers', () => {
        const rows = Array.from(readCsvFile('col1,col2\n1,2\n3,4\n', { dialect: 'excel', fieldnames: false }));

        expect(rows).toEqual([
            ['col1', 'col2'],
            ['1', '2'],
            ['3', '4']
        ]);
    });

    it('reads csv rows iterator when fieldnames is false and iterator is true', () => {
        const rows = Array.from(readCsvFile('a,b\n1,2\n', { fieldnames: false, iterator: true }));

        expect(rows).toEqual([
            ['a', 'b'],
            ['1', '2']
        ]);
    });

    it('reads csv with custom field names and iterator mode', () => {
        const rows = Array.from(
            readCsvFile('1|2\n3|4\n', {
                dialect: '|',
                iterator: true,
                fieldnames: ['c1', 'c2']
            })
        );

        expect(rows).toEqual([
            { c1: '1', c2: '2' },
            { c1: '3', c2: '4' }
        ]);
    });

    it('reads csv with quoted fields and CRLF newlines', () => {
        const rows = Array.from(readCsvFile('name,desc\r\n"A","x""y"\r\n', { dialect: 'excel' }));

        expect(rows).toEqual([{ name: 'A', desc: 'x"y' }]);
    });

    it('returns empty rows in auto mode for empty input', () => {
        const rows = Array.from(readCsvFile('', { dialect: 'auto' }));

        expect(rows).toEqual([]);
    });

    it('returns empty iterator in auto mode for empty input', () => {
        const rows = Array.from(readCsvFile('', { dialect: 'auto', iterator: true }));

        expect(rows).toEqual([]);
    });

    it('falls back to default delimiter when dialect is unknown', () => {
        const rows = Array.from(readCsvFile('a,b\n1,2\n', { dialect: 'unknown' }));

        expect(rows).toEqual([{ a: '1', b: '2' }]);
    });

    it('handles csv payload without trailing newline', () => {
        const rows = Array.from(readCsvFile('a,b\n1,2', { dialect: 'excel' }));

        expect(rows).toEqual([{ a: '1', b: '2' }]);
    });

    it('keeps searching when first auto-detect line is empty', () => {
        expect(() => Array.from(readCsvFile('\nplain-text', { dialect: 'auto', maxTries: 1, sampleSize: 12 }))).toThrow(
            /auto-detect CSV dialect/u
        );
    });

    it('auto-detects csv delimiter', () => {
        const rows = Array.from(readCsvFile('col1;col2\n1;2\n', { dialect: 'auto' }));

        expect(rows).toEqual([{ col1: '1', col2: '2' }]);
    });

    it('returns empty iterator for empty csv input in iterator mode', () => {
        const rows = Array.from(readCsvFile('', { dialect: 'excel', iterator: true }));

        expect(rows).toEqual([]);
    });

    it('throws when auto-detection fails', () => {
        expect(() =>
            Array.from(
                readCsvFile('plain text without delimiter', {
                    dialect: 'auto',
                    maxTries: 2,
                    sampleSize: 4
                })
            )
        ).toThrow(/auto-detect CSV dialect/u);
    });

    it('exports csv constants', () => {
        expect(CSV_SAMPLE_SIZE).toBe(4096);
        expect(CSV_MAX_TRIES).toBe(8);
    });

    it('writes csv for dictionaries with inferred headers', () => {
        const payload = writeCsvFile([
            { col1: '1', col2: '2' },
            { col1: '3', col2: '4' }
        ]);

        expect(payload).toBe('col1,col2\n1,2\n3,4\n');
    });

    it('writes csv for dictionary-like objects exposing toDict', () => {
        class Row {
            private readonly col1: string;

            private readonly col2: string;

            public constructor(col1: string, col2: string) {
                this.col1 = col1;
                this.col2 = col2;
            }

            public toDict(): Record<string, string> {
                return {
                    col1: this.col1,
                    col2: this.col2
                };
            }
        }

        const payload = writeCsvFile([new Row('1', '2'), new Row('3', '4')]);

        expect(payload).toBe('col1,col2\n1,2\n3,4\n');
    });

    it('writes csv for list rows', () => {
        const payload = writeCsvFile([
            ['col1', 'col2'],
            ['1', '2']
        ]);

        expect(payload).toBe('col1,col2\n1,2\n');
    });

    it('writes csv with explicit delimiter, without header and with quoted values', () => {
        const payload = writeCsvFile([{ label: 'a;b', text: 'line\nline' }, ['x', 'y']], {
            fieldnames: ['label', 'text'],
            header: false,
            dialect: 'ignored',
            delimiter: ';'
        });

        expect(payload).toBe('"a;b";"line\nline"\nx;y\n');
    });

    it('writes csv when first row is array and subsequent row is an object', () => {
        const payload = writeCsvFile([['k1', 'k2'], { k1: 'v1', k2: 'v2' }]);

        expect(payload).toBe('k1,k2\nv1,v2\n');
    });

    it('fills missing dictionary fields with empty string', () => {
        const payload = writeCsvFile([{ a: '1' }], { fieldnames: ['a', 'b'] });

        expect(payload).toBe('a,b\n1,\n');
    });

    it('fills missing parsed csv values with empty strings', () => {
        const rows = Array.from(readCsvFile('a,b\n1\n', { dialect: 'excel' }));

        expect(rows).toEqual([{ a: '1', b: '' }]);
    });

    it('returns empty list for excel mode empty input when iterator is false', () => {
        const rows = Array.from(readCsvFile('', { dialect: 'excel', iterator: false }));

        expect(rows).toEqual([]);
    });

    it('writes empty csv payload for empty iterable', () => {
        expect(writeCsvFile([])).toBe('');
    });

    it('serializes json with path-like values', () => {
        const path = new URL('file:///tmp/data.json');

        const payload = writeJsonFile({ path });

        expect(payload).toBe('{"path":"file:///tmp/data.json"}');
        expect(JSON.parse(payload)).toEqual({ path: 'file:///tmp/data.json' });
    });

    it('supports json indentation and ascii escaping', () => {
        const payload = writeJsonFile({ word: 'cafe', symbol: 'é' }, { indent: 2, ensureAscii: true });

        expect(payload).toContain('\n  ');
        expect(payload).toContain('\\u00e9');
    });

    it('returns value unchanged for non-string fileType input', () => {
        const weirdType = 42 as unknown as string;

        expect(getFileType(weirdType)).toBe(42);
    });

    it('returns csv file type when dotted value resolves to csv', () => {
        expect(getFileType('.csv')).toBe(FileType.CSV);
    });

    it('encodes URL values via encoder URL branch', () => {
        expect(EnhancedJSONEncoder.replacer('url', new URL('https://local.test'))).toBe('https://local.test/');
    });

    it('keeps default unknown handling in enhanced encoder', () => {
        const value = { key: 'value' };

        expect(EnhancedJSONEncoder.replacer('root', value)).toBe(value);
    });

    it('supports browser adapter with memory storage', async () => {
        const storage = new Map<string, string>();
        const adapter = createFileAdapter({
            runtime: 'browser',
            storage: {
                getItem(key): string | null {
                    return storage.get(key) ?? null;
                },
                setItem(key, value): void {
                    storage.set(key, value);
                },
                removeItem(key): void {
                    storage.delete(key);
                }
            }
        });

        const path = '/browser/data.txt';
        await adapter.writeText(path, 'hello', 'utf-8');

        expect(await adapter.exists(path)).toBe(true);
        expect(await adapter.readText(path, 'utf-8')).toBe('hello');
        expect((await adapter.stat(path)).size).toBe(5);
        await adapter.ensureParentDirectory(path);

        await adapter.remove(path);

        expect(await adapter.exists(path)).toBe(false);
    });

    it('supports browser adapter fallback storage when localStorage is missing', async () => {
        vi.stubGlobal('process', undefined);
        vi.stubGlobal('localStorage', undefined);

        const adapter = createFileAdapter();
        const path = '/browser/default.txt';

        await adapter.writeText(path, 'hello fallback', 'utf-8');

        expect(await adapter.readText(path, 'utf-8')).toBe('hello fallback');
        expect(await adapter.exists('/browser/missing.txt')).toBe(false);
        await adapter.remove(path);
    });

    it('throws on missing browser adapter entries', async () => {
        const adapter = createFileAdapter({
            runtime: 'browser',
            storage: {
                getItem() {
                    return null;
                },
                setItem() {
                    // noop
                },
                removeItem() {
                    // noop
                }
            }
        });

        await expect(adapter.readText('/missing.txt', 'utf-8')).rejects.toThrow(/does not exist/u);
        await expect(adapter.stat('/missing.txt')).rejects.toThrow(/does not exist/u);
    });

    it('uses existing global localStorage in browser runtime', async () => {
        const storage = new Map<string, string>();
        vi.stubGlobal('process', undefined);
        vi.stubGlobal('localStorage', {
            getItem(key: string): string | null {
                return storage.get(key) ?? null;
            },
            setItem(key: string, value: string): void {
                storage.set(key, value);
            },
            removeItem(key: string): void {
                storage.delete(key);
            }
        });

        const adapter = createFileAdapter();
        await adapter.writeText('/browser/global.txt', 'ok', 'utf-8');

        expect(await adapter.readText('/browser/global.txt', 'utf-8')).toBe('ok');
    });

    it('can resolve cache path when home expansion branch is bypassed', async () => {
        const startsWith = vi.spyOn(String.prototype, 'startsWith').mockReturnValue(false);

        const path = await getCachePath();

        expect(path).toBe(CACHE_PATH);
        startsWith.mockRestore();
    });

    it('falls back to CACHE_PATH when os.homedir returns an empty value', async () => {
        vi.resetModules();
        vi.doMock('node:os', async () => {
            const actual = await vi.importActual<typeof import('node:os')>('node:os');
            return {
                ...actual,
                homedir: (): string => ''
            };
        });

        const freshModule = await import('src/utils/file.ts');
        const path = await freshModule.getCachePath();

        expect(path).toBe(freshModule.CACHE_PATH);

        vi.doUnmock('node:os');
        vi.resetModules();
    });
});
