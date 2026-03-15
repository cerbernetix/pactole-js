import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { File, FileType, getFileType } from 'src/utils/index.ts';

import { tmpdir } from 'node:os';
import { join } from 'node:path';

let root = '';

const getPath = (...parts: string[]): string => join(root, ...parts);

describe('FileType', () => {
    it('resolves known values and falls back to text for unknown values', () => {
        expect(getFileType(FileType.CSV)).toBe(FileType.CSV);
        expect(getFileType('.json')).toBe(FileType.JSON);
        expect(getFileType('TXT')).toBe(FileType.TEXT);
        expect(getFileType('unknown')).toBe(FileType.TEXT);
    });
});

describe('File', () => {
    beforeAll(async () => {
        const fsModule = await import('node:fs/promises');
        root = await fsModule.mkdtemp(join(tmpdir(), 'pactole-file-class-'));
    });

    afterAll(async () => {
        if (!root) {
            return;
        }

        const fsModule = await import('node:fs/promises');
        await fsModule.rm(root, { recursive: true, force: true });
    });

    it('infers file type from extension and exposes metadata', async () => {
        const file = new File(getPath('data.csv'));

        expect(file.path.endsWith('data.csv')).toBe(true);
        expect(file.type).toBe(FileType.CSV);
        expect(file.encoding).toBe('utf-8');

        await file.write([
            { col1: '1', col2: '2' },
            { col1: '3', col2: '4' }
        ]);

        expect(await file.exists()).toBe(true);
        expect(await file.size()).toBeGreaterThan(0);
        expect(await file.date()).toBeInstanceOf(Date);
    });

    it('reads and writes text content', async () => {
        const file = new File(getPath('note.txt'));

        await file.write('hello\nworld');

        expect(await file.read()).toBe('hello\nworld');
        expect(await file.readLines()).toEqual(['hello', 'world']);
    });

    it('reads and writes json content', async () => {
        const file = new File(getPath('data.json'));
        const payload = {
            key: 'value',
            items: [1, 2, 3]
        };

        await file.write(payload);

        expect(await file.read()).toEqual(payload);
    });

    it('reads and writes csv content', async () => {
        const file = new File(getPath('rows.csv'));
        const rows = [
            { col1: '1', col2: '2' },
            { col1: '3', col2: '4' }
        ];

        await file.write(rows);

        expect(await file.read()).toEqual(rows);
        expect(await file.readLines()).toEqual(rows);
    });

    it('handles missing file behaviors', async () => {
        const file = new File(getPath('missing.txt'));

        await expect(file.read({ throwOnError: false })).resolves.toBeNull();
        await expect(file.readLines({ throwOnError: false })).resolves.toEqual([]);
        await expect(file.read()).rejects.toThrow(/does not exist/u);
    });

    it('returns null for malformed json when throwOnError is disabled', async () => {
        const file = new File(getPath('bad.json'));
        const fsModule = await import('node:fs/promises');
        const pathModule = await import('node:path');

        await fsModule.mkdir(pathModule.dirname(file.path), { recursive: true });
        await fsModule.writeFile(file.path, '{"key":', { encoding: 'utf-8' });

        await expect(file.read({ throwOnError: false })).resolves.toBeNull();
        await expect(file.read()).rejects.toThrow(/Failed to read JSON file/u);
    });

    it('deletes files and supports non-throwing delete on missing files', async () => {
        const file = new File(getPath('delete.txt'));

        await file.write('content');
        expect(await file.exists()).toBe(true);

        await file.delete();
        expect(await file.exists()).toBe(false);

        await expect(file.delete({ throwOnError: false })).resolves.toBeUndefined();
        await expect(file.delete()).rejects.toThrow(/does not exist/u);
    });

    it('returns zero size for missing file', async () => {
        const file = new File(getPath('size-missing.txt'));

        expect(await file.size()).toBe(0);
    });

    it('supports custom fileType option when extension differs', async () => {
        const file = new File(getPath('payload.bin'), { fileType: 'json' });

        await file.write({ ok: true });
        expect(await file.read()).toEqual({ ok: true });
    });

    it('defaults to text type when no extension is provided', () => {
        const file = new File(getPath('payload'));

        expect(file.type).toBe(FileType.TEXT);
    });

    it('maps CSV read failures to dedicated error messages', async () => {
        const file = new File(getPath('broken.csv'), {
            fileType: 'csv',
            adapter: {
                async exists() {
                    return true;
                },
                async stat() {
                    return { size: 1, mtime: new Date() };
                },
                async readText() {
                    throw new Error('boom');
                },
                async writeText() {
                    // noop
                },
                async remove() {
                    // noop
                },
                async ensureParentDirectory() {
                    // noop
                }
            }
        });

        await expect(file.read()).rejects.toThrow(/Failed to read CSV file/u);
    });

    it('maps non-json/csv read failures to original errors', async () => {
        const file = new File(getPath('broken.txt'), {
            adapter: {
                async exists() {
                    return true;
                },
                async stat() {
                    return { size: 1, mtime: new Date() };
                },
                async readText() {
                    throw new Error('plain read error');
                },
                async writeText() {
                    // noop
                },
                async remove() {
                    // noop
                },
                async ensureParentDirectory() {
                    // noop
                }
            }
        });

        await expect(file.read()).rejects.toThrow(/plain read error/u);
    });

    it('swallows write failures when throwOnError is false', async () => {
        const file = new File(getPath('silent-write.txt'), {
            adapter: {
                async exists() {
                    return true;
                },
                async stat() {
                    return { size: 1, mtime: new Date() };
                },
                async readText() {
                    return 'ok';
                },
                async writeText() {
                    throw new Error('write failed');
                },
                async remove() {
                    // noop
                },
                async ensureParentDirectory() {
                    // noop
                }
            }
        });

        await expect(file.write('content', { throwOnError: false })).resolves.toBeUndefined();
    });

    it('rethrows generic write failures for text files', async () => {
        const file = new File(getPath('write-error.txt'), {
            adapter: {
                async exists() {
                    return true;
                },
                async stat() {
                    return { size: 1, mtime: new Date() };
                },
                async readText() {
                    return 'ok';
                },
                async writeText() {
                    throw new Error('plain write failure');
                },
                async remove() {
                    // noop
                },
                async ensureParentDirectory() {
                    // noop
                }
            }
        });

        await expect(file.write('content')).rejects.toThrow(/plain write failure/u);
    });

    it('maps write failures to csv/json specific errors', async () => {
        const adapter = {
            async exists() {
                return true;
            },
            async stat() {
                return { size: 1, mtime: new Date() };
            },
            async readText() {
                return 'ok';
            },
            async writeText() {
                throw new Error('write failed');
            },
            async remove() {
                // noop
            },
            async ensureParentDirectory() {
                // noop
            }
        };

        const csv = new File(getPath('broken-write.csv'), { adapter, fileType: 'csv' });
        const json = new File(getPath('broken-write.json'), { adapter, fileType: 'json' });

        await expect(csv.write([{ a: 1 }])).rejects.toThrow(/Failed to write CSV file/u);
        await expect(json.write({ a: 1 })).rejects.toThrow(/Failed to write JSON file/u);
    });

    it('rethrows delete failures when throwOnError is true and swallows otherwise', async () => {
        const file = new File(getPath('delete-error.txt'), {
            adapter: {
                async exists() {
                    return true;
                },
                async stat() {
                    return { size: 1, mtime: new Date() };
                },
                async readText() {
                    return 'ok';
                },
                async writeText() {
                    // noop
                },
                async remove() {
                    throw new Error('delete failed');
                },
                async ensureParentDirectory() {
                    // noop
                }
            }
        });

        await expect(file.delete()).rejects.toThrow(/delete failed/u);
        await expect(file.delete({ throwOnError: false })).resolves.toBeUndefined();
    });
});
