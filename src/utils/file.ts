import { unzipSync } from 'fflate';

/**
 * Default cache root path used by {@link getCachePath}.
 *
 * On Node.js the leading `~/` is expanded to the user's home directory.
 */
export const CACHE_PATH = '~/.cache';

/**
 * Number of characters examined per auto-detection attempt when sniffing a CSV delimiter.
 */
export const CSV_SAMPLE_SIZE = 4096;

/**
 * Maximum number of auto-detection attempts before {@link readCsvFile} throws when the
 * dialect cannot be determined.
 */
export const CSV_MAX_TRIES = 8;

const CSV_AUTO = 'auto';
const CSV_EXCEL = 'excel';

/**
 * File system metadata returned by a {@link FileAdapter} stat call.
 */
export interface FileAdapterStat {
    /** File size in bytes. */
    size: number;
    /** Last modification date. */
    mtime: Date;
}

/**
 * Runtime adapter abstraction for persistence operations.
 *
 * Implementations are provided for Node.js (`node:fs`) and browser
 * (`localStorage`/in-memory) environments. Custom adapters can be supplied to
 * {@link File} for testing or alternative storage backends.
 */
export interface FileAdapter {
    /** Return whether the file at `path` exists. */
    exists(path: string): Promise<boolean>;
    /** Return size and modification-date metadata for the file at `path`. */
    stat(path: string): Promise<FileAdapterStat>;
    /** Read the file at `path` as text using the given `encoding`. */
    readText(path: string, encoding: string): Promise<string>;
    /** Write `content` to the file at `path` using the given `encoding`. */
    writeText(path: string, content: string, encoding: string): Promise<void>;
    /** Delete the file at `path`. */
    remove(path: string): Promise<void>;
    /** Ensure the parent directory of `path` exists (no-op in browser adapters). */
    ensureParentDirectory(path: string): Promise<void>;
}

interface BrowserStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

interface BrowserFileEntry {
    content: string;
    updatedAt: string;
    size: number;
}

/**
 * Supported file types handled by the file utilities.
 */
export const FileType = {
    CSV: 'csv',
    JSON: 'json',
    TEXT: 'txt'
} as const;

export type FileType = (typeof FileType)[keyof typeof FileType];

/**
 * Resolve a {@link FileType} from a constant value, a plain type string, or a dotted extension.
 *
 * Unknown values fall back to {@link FileType.TEXT}.
 *
 * @param fileType - A `FileType` constant, a plain string such as `'csv'`, or a dotted extension
 *   such as `'.json'`.
 * @returns The matching `FileType` constant.
 *
 * @example
 * ```ts
 * getFileType('csv');   // 'csv'
 * getFileType('.json'); // 'json'
 * getFileType('log');   // 'txt' (falls back to text)
 * ```
 */
export function getFileType(fileType: FileType | string): FileType {
    if (typeof fileType !== 'string') {
        return fileType;
    }

    const normalized = fileType.toLowerCase().replace(/^\./u, '');

    if (normalized === FileType.CSV) {
        return FileType.CSV;
    }
    if (normalized === FileType.JSON) {
        return FileType.JSON;
    }

    return FileType.TEXT;
}

/**
 * JSON replacer that serialises `URL` instances to their string form.
 *
 * Pass {@link EnhancedJSONEncoder.replacer} as the second argument to
 * `JSON.stringify` (or use {@link writeJsonFile}) so that `URL` values in the
 * data graph are not lost during serialisation.
 *
 * @example
 * ```ts
 * JSON.stringify({ url: new URL('https://example.com') }, EnhancedJSONEncoder.replacer);
 * // '{"url":"https://example.com/"}'
 * ```
 */
export class EnhancedJSONEncoder {
    /**
     * Replacer function compatible with `JSON.stringify`.
     *
     * @param _key - The key of the current value (unused).
     * @param value - The value being serialised.
     * @returns The serialisable representation of `value`.
     */
    public static replacer(_key: string, value: unknown): unknown {
        if (value instanceof URL) {
            return value.toString();
        }

        return value;
    }
}

type CsvLine = Record<string, string> | string[];

/**
 * Options for {@link readCsvFile}.
 */
export interface ReadCsvFileOptions {
    /**
     * Dialect hint used to pick a field delimiter.
     *
     * - `'auto'` (default): delimiter is detected from the first non-empty line.
     * - `'excel'`: comma delimiter (standard CSV).
     * - A single character: used directly as the delimiter.
     */
    dialect?: string;
    /** When `true`, return a lazy generator instead of an array. Default is `false`. */
    iterator?: boolean;
    /** Number of characters examined per auto-detection attempt. Default is {@link CSV_SAMPLE_SIZE}. */
    sampleSize?: number;
    /** Maximum auto-detection attempts before throwing. Default is {@link CSV_MAX_TRIES}. */
    maxTries?: number;
    /**
     * Explicit column names to use as dictionary keys.
     *
     * - `string[]`: use these names; the first data row is treated as a data row, not a header.
     * - `false`: return raw row arrays without any header mapping.
     * - Omitted: the first row is used as the header.
     */
    fieldnames?: string[] | false;
    /** Override the field delimiter regardless of the dialect. */
    delimiter?: string;
}

/**
 * Options for {@link writeCsvFile}.
 */
export interface WriteCsvFileOptions {
    /** Explicit ordered column names to include. Inferred from the first row's keys when omitted. */
    fieldnames?: string[];
    /**
     * Dialect hint used to pick a field delimiter.
     *
     * - `'excel'` (default): comma delimiter.
     * - A single character: used directly as the delimiter.
     */
    dialect?: string;
    /** Whether to write a header row. Default is `true`. */
    header?: boolean;
    /** Override the field delimiter regardless of the dialect. */
    delimiter?: string;
}

/**
 * Options for {@link writeJsonFile}.
 */
export interface WriteJsonFileOptions {
    /** Indentation passed to `JSON.stringify`. A number gives that many spaces; a string is used as-is. */
    indent?: number | string;
    /**
     * When `true`, all non-ASCII code points are escaped as `\uXXXX` sequences.
     * Default is `false`.
     */
    ensureAscii?: boolean;
}

/**
 * Options for {@link fetchContent}.
 */
export interface FetchContentOptions extends Omit<RequestInit, 'signal'> {
    /** When `true`, return the response as a `Uint8Array` instead of text. Default is `false`. */
    binary?: boolean;
    /**
     * Request timeout in seconds.
     *
     * A single number sets the hard timeout. A tuple `[connect, read]` uses the
     * second element as the hard timeout (matching the Python `(connect, read)` convention).
     * Default is `[6, 30]`.
     */
    timeout?: number | [number, number];
}

class FileNotFoundError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'FileNotFoundError';
    }
}

/**
 * Options for {@link readZipFile}.
 */
export interface ReadZipFileOptions {
    /** Exact entry name to extract. Takes precedence over `ext`. */
    filename?: string;
    /** File extension (e.g. `'.csv'`) used to locate the first matching entry when `filename` is not set. */
    ext?: string;
    /** Text encoding for decoding the entry bytes (e.g. `'utf-8'`). When omitted, raw bytes are returned. */
    encoding?: string;
    /**
     * How to handle decoding errors.
     *
     * - `'ignore'` (default): replacement characters (`\uFFFD`) are stripped from the output.
     * - `'replace'`: replacement characters are kept in the output.
     * - `'strict'`: a `TypeError` is thrown on the first invalid byte sequence.
     */
    decodingErrors?: 'ignore' | 'strict' | 'replace';
}

const ZIP_SIGNATURES = [
    [0x50, 0x4b, 0x03, 0x04],
    [0x50, 0x4b, 0x05, 0x06],
    [0x50, 0x4b, 0x07, 0x08]
] as const;

/**
 * Constructor options for {@link File}.
 */
export interface FileOptions {
    /**
     * Explicit file type override.
     *
     * Accepts a {@link FileType} constant, a plain extension string (e.g. `'csv'`),
     * or a dotted extension (e.g. `'.json'`). When omitted, the type is inferred
     * from the file path extension.
     */
    fileType?: FileType | string;
    /** Text encoding used for reading and writing. Default is `'utf-8'`. */
    encoding?: string;
    /** Custom persistence adapter. Defaults to the runtime-detected adapter from {@link createFileAdapter}. */
    adapter?: FileAdapter;
}

/**
 * Common read/write options shared by {@link File} methods.
 */
export interface FileReadOptions {
    /**
     * When `false`, errors (missing file, parse failures, write failures) are swallowed
     * and the caller receives `null` or `undefined` instead of an exception.
     * Default is `true`.
     */
    throwOnError?: boolean;
}

const isNodeRuntime = (): boolean =>
    typeof process !== 'undefined' && typeof process.versions?.node === 'string' && process.release?.name === 'node';

const normalizeFolderPath = (folder: string): string => {
    const safeFolder = folder
        .replaceAll('\\', '/')
        .replace(/^[./]+/u, '')
        .replace(/[./]+$/u, '')
        .replaceAll('..', '_');

    return safeFolder;
};

const withTrailingSlashTrimmed = (value: string): string => value.replace(/\/+$/u, '');

const getCsvDelimiter = (dialect: string | undefined, fallback: string): string => {
    if (!dialect || dialect === CSV_EXCEL) {
        return ',';
    }

    if (dialect.length === 1) {
        return dialect;
    }

    return fallback;
};

const detectCsvDelimiter = (sample: string): string | undefined => {
    const candidates = [',', ';', '\t', '|'];
    const firstLine = sample.split(/\r?\n/u, 1)[0];

    if (firstLine.length === 0) {
        return undefined;
    }

    let bestDelimiter: string | undefined;
    let bestScore = 0;

    for (const candidate of candidates) {
        const score = firstLine.split(candidate).length - 1;
        if (score > bestScore) {
            bestScore = score;
            bestDelimiter = candidate;
        }
    }

    return bestScore > 0 ? bestDelimiter : undefined;
};

const parseCsvRows = (content: string, delimiter: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let value = '';
    let inQuotes = false;

    const pushValue = (): void => {
        row.push(value);
        value = '';
    };

    const pushRow = (): void => {
        rows.push(row);
        row = [];
    };

    for (let i = 0; i < content.length; i += 1) {
        const char = content[i];
        const next = content[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                value += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (!inQuotes && char === delimiter) {
            pushValue();
            continue;
        }

        if (!inQuotes && (char === '\n' || char === '\r')) {
            if (char === '\r' && next === '\n') {
                i += 1;
            }
            pushValue();
            pushRow();
            continue;
        }

        value += char;
    }

    if (value.length > 0 || row.length > 0) {
        pushValue();
        pushRow();
    }

    return rows;
};

const escapeCsvValue = (value: unknown, delimiter: string): string => {
    const text = String(value);

    if (/["\r\n]/u.test(text) || text.includes(delimiter)) {
        return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
};

const getNodePathTools = async (): Promise<{
    dirname: (input: string) => string;
    join: (...input: string[]) => string;
    normalize: (input: string) => string;
}> => {
    const pathModule = await import('node:path');
    return {
        dirname: pathModule.dirname,
        join: pathModule.join,
        normalize: pathModule.normalize
    };
};

const getNodeCacheBasePath = async (): Promise<string> => {
    if (!isNodeRuntime()) {
        return withTrailingSlashTrimmed(CACHE_PATH);
    }

    const osModule = await import('node:os');
    const pathTools = await getNodePathTools();
    const homedir = osModule.homedir();

    if (CACHE_PATH.startsWith('~/') && homedir.length > 0) {
        return pathTools.join(homedir, CACHE_PATH.slice(2));
    }

    return CACHE_PATH;
};

/**
 * Ensure the parent directory of a file path exists, creating it recursively if necessary.
 *
 * This is a no-op in browser environments where the storage backend does not use
 * a real filesystem hierarchy.
 *
 * @param path - Absolute path to a file whose parent directory should be created.
 * @returns A promise that resolves once the directory exists.
 *
 * @example
 * ```ts
 * await ensureDirectory('/home/user/.cache/pactole/data.json');
 * ```
 */
export async function ensureDirectory(path: string): Promise<void> {
    if (!isNodeRuntime()) {
        return;
    }

    const fsModule = await import('node:fs/promises');
    const pathTools = await getNodePathTools();
    const directory = pathTools.dirname(path);
    await fsModule.mkdir(directory, { recursive: true });
}

/**
 * Return the cache directory path, optionally creating it.
 *
 * On Node.js, `~/` in {@link CACHE_PATH} is expanded to the user's home directory.
 * Path traversal characters in `folder` are sanitised before appending.
 * In browser environments the path is returned as a plain string without
 * filesystem operations.
 *
 * @param folder - Optional sub-folder appended under the cache root after sanitisation.
 * @param create - When `true`, the resolved directory is created recursively on Node.js.
 *   Default is `false`.
 * @returns The resolved absolute (Node.js) or logical (browser) cache path.
 *
 * @example
 * ```ts
 * const path = await getCachePath('pactole/fdj', true);
 * // '/home/user/.cache/pactole/fdj' (created if absent)
 * ```
 */
export async function getCachePath(folder?: string, create = false): Promise<string> {
    const basePath = await getNodeCacheBasePath();
    const normalizedFolder = folder ? normalizeFolderPath(folder) : '';

    let cachePath = withTrailingSlashTrimmed(basePath);
    if (normalizedFolder.length > 0) {
        if (isNodeRuntime()) {
            const pathTools = await getNodePathTools();
            cachePath = pathTools.normalize(pathTools.join(cachePath, normalizedFolder));
        } else {
            cachePath = `${cachePath}/${normalizedFolder}`;
        }
    }

    if (create && isNodeRuntime()) {
        const fsModule = await import('node:fs/promises');
        await fsModule.mkdir(cachePath, { recursive: true });
    }

    return cachePath;
}

/**
 * Fetch textual or binary content from a URL.
 *
 * An `AbortController` is wired to the hard timeout so that hung connections are
 * cancelled automatically. The `signal` property of `RequestInit` is managed
 * internally and must not be passed in `options`.
 *
 * @param url - The URL to fetch.
 * @param options - Optional fetch options including a `timeout` and `binary` flag.
 * @returns Resolves to the response body as a `string` (default) or `Uint8Array` when
 *   `binary` is `true`.
 * @throws `Error` when the HTTP response status is not in the 2xx range.
 * @throws Whatever `fetch` throws when the request is aborted or the network fails.
 *
 * @example
 * ```ts
 * const text = await fetchContent('https://example.com/data.csv');
 * const bytes = await fetchContent('https://example.com/archive.zip', { binary: true });
 * ```
 */
export async function fetchContent(url: string, options: FetchContentOptions = {}): Promise<string | Uint8Array> {
    const { binary = false, timeout = [6, 30], ...requestInit } = options;
    const timeoutMs = (Array.isArray(timeout) ? timeout[1] : timeout) * 1000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { ...requestInit, signal: controller.signal });
        if (!response.ok) {
            throw new Error(`Failed to fetch content from ${url}: ${response.status}`);
        }

        if (binary) {
            return new Uint8Array(await response.arrayBuffer());
        }

        return await response.text();
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Extract a single entry from ZIP archive bytes.
 *
 * The archive bytes are decompressed synchronously with fflate. Entry selection
 * follows this priority: `filename` exact match → `ext` suffix match → first
 * non-directory entry.
 *
 * @param file - ZIP archive as a `Uint8Array` or `ArrayBuffer`.
 * @param options - Entry selection and text-decoding options.
 * @returns The raw entry bytes as a `Uint8Array` when `encoding` is not provided,
 *   or the decoded text `string` when `encoding` is set.
 * @throws `FileNotFoundError` when no matching entry is found in the archive.
 * @throws `TypeError` when `encoding` is `'strict'` and the bytes are invalid for
 *   the requested encoding.
 *
 * @example
 * ```ts
 * const bytes = await fetchContent('https://example.com/archive.zip', { binary: true });
 * const csv = await readZipFile(bytes as Uint8Array, { ext: '.csv', encoding: 'utf-8' });
 * ```
 */
export async function readZipFile(
    file: Uint8Array | ArrayBuffer,
    options: ReadZipFileOptions = {}
): Promise<Uint8Array | string> {
    const { filename, ext, encoding, decodingErrors = 'ignore' } = options;
    const bytes = file instanceof Uint8Array ? file : new Uint8Array(file);
    const archive = unzipSync(bytes);
    const entries = Object.entries(archive).filter(([entryName]) => !entryName.endsWith('/'));

    let target: [string, Uint8Array] | undefined = entries[0];
    if (filename) {
        target = entries.find(([entryName]) => entryName === filename);
    } else if (ext) {
        target = entries.find(([entryName]) => entryName.toLowerCase().endsWith(ext.toLowerCase()));
    }

    if (!target || target[1] === undefined) {
        throw new FileNotFoundError('The file does not exist in the archive.');
    }

    const data = target[1];

    if (!encoding) {
        return data;
    }

    try {
        const decoder = new TextDecoder(encoding, { fatal: decodingErrors === 'strict' });
        const decoded = decoder.decode(data);

        if (decodingErrors === 'ignore') {
            return decoded.replaceAll('\uFFFD', '');
        }

        return decoded;
    } catch (error) {
        if (decodingErrors === 'replace') {
            const decoder = new TextDecoder(encoding, { fatal: false });
            return decoder.decode(data);
        }

        throw error;
    }
}

/**
 * Detect whether binary content starts with a recognised ZIP file signature.
 *
 * The three standard PK signatures are checked:
 * - `50 4B 03 04` — local file header (standard archive)
 * - `50 4B 05 06` — end of central directory (empty archive)
 * - `50 4B 07 08` — data descriptor / spanning marker
 *
 * @param content - Raw bytes to inspect, as a `Uint8Array` or `ArrayBuffer`.
 * @returns `true` when the first four bytes match a known ZIP signature.
 *
 * @example
 * ```ts
 * const bytes = await fetchContent('https://example.com/archive.zip', { binary: true });
 * if (isZipContent(bytes as Uint8Array)) {
 *     const csv = await readZipFile(bytes as Uint8Array, { ext: '.csv', encoding: 'utf-8' });
 * }
 * ```
 */
export function isZipContent(content: Uint8Array | ArrayBuffer): boolean {
    const bytes = content instanceof Uint8Array ? content : new Uint8Array(content);

    if (bytes.length < 4) {
        return false;
    }

    return ZIP_SIGNATURES.some(signature => signature.every((value, index) => bytes[index] === value));
}

/**
 * Parse CSV text content into an iterable of dictionaries or row arrays.
 *
 * When `fieldnames` is `false`, each item is a `string[]` row. Otherwise each
 * item is a `Record<string, string>` keyed by the column names. Missing fields
 * in a row are filled with empty strings.
 *
 * Auto-detection (`dialect: 'auto'`) scans up to `maxTries` progressively
 * larger samples of the input and picks the first candidate delimiter that
 * appears more than once on the first line.
 *
 * @param content - CSV text to parse.
 * @param options - Dialect, delimiter, fieldname and iteration options.
 * @returns An `Iterable` of row objects or row arrays depending on `fieldnames`.
 * @throws `Error` when `dialect` is `'auto'` and the delimiter cannot be detected
 *   within the configured sample budget.
 *
 * @example
 * ```ts
 * const rows = Array.from(readCsvFile('col1,col2\n1,2\n3,4\n'));
 * // [{ col1: '1', col2: '2' }, { col1: '3', col2: '4' }]
 *
 * const raw = Array.from(readCsvFile('a;b\n1;2\n', { dialect: 'auto', fieldnames: false }));
 * // [['a', 'b'], ['1', '2']]
 * ```
 */
export function readCsvFile(content: string, options: ReadCsvFileOptions = {}): Iterable<CsvLine> {
    const {
        dialect = CSV_AUTO,
        iterator = false,
        sampleSize = CSV_SAMPLE_SIZE,
        maxTries = CSV_MAX_TRIES,
        fieldnames,
        delimiter
    } = options;

    let resolvedDelimiter = delimiter ?? ',';

    if (dialect === CSV_AUTO) {
        let found = false;
        for (let index = 0; index < maxTries; index += 1) {
            const sample = content.slice(0, sampleSize * (index + 1));
            if (sample.length === 0) {
                return iterator ? (function* empty() {})() : [];
            }

            const autoDelimiter = detectCsvDelimiter(sample);
            if (autoDelimiter) {
                resolvedDelimiter = autoDelimiter;
                found = true;
                break;
            }
        }

        if (!found) {
            throw new Error('Could not auto-detect CSV dialect after multiple attempts.');
        }
    } else {
        resolvedDelimiter = delimiter ?? getCsvDelimiter(dialect, ',');
    }

    const rows = parseCsvRows(content, resolvedDelimiter);

    if (fieldnames === false) {
        return iterator
            ? (function* listIterator() {
                  yield* rows;
              })()
            : rows;
    }

    if (rows.length === 0) {
        return iterator ? (function* empty() {})() : [];
    }

    const header = fieldnames ?? rows[0];
    const startAt = fieldnames ? 0 : 1;
    const mapped = rows.slice(startAt).map(row => {
        const entry: Record<string, string> = {};
        header.forEach((name, index) => {
            entry[name] = row[index] ?? '';
        });
        return entry;
    });

    return iterator
        ? (function* dictIterator() {
              yield* mapped;
          })()
        : mapped;
}

/**
 * Serialise an iterable of rows to CSV text.
 *
 * Rows may be:
 * - `Record<string, unknown>` — serialised as keyed dictionaries.
 * - `string[]` — serialised as positional arrays (no header is written).
 * - Objects with a `toDict()` method — `toDict()` is called first.
 *
 * Values containing the delimiter, double-quotes, or newlines are automatically
 * quoted and escaped per RFC 4180.
 *
 * @param data - Iterable of rows to write.
 * @param options - Dialect, delimiter, fieldname, and header options.
 * @returns A CSV-formatted string with a trailing newline, or an empty string
 *   when `data` is empty.
 *
 * @example
 * ```ts
 * writeCsvFile([{ col1: '1', col2: '2' }, { col1: '3', col2: '4' }]);
 * // 'col1,col2\n1,2\n3,4\n'
 *
 * writeCsvFile([['a', 'b'], ['1', '2']]);
 * // 'a,b\n1,2\n'
 * ```
 */
export function writeCsvFile(
    data: Iterable<Record<string, unknown> | string[] | { toDict?: () => Record<string, unknown> }>,
    options: WriteCsvFileOptions = {}
): string {
    const { fieldnames, dialect = CSV_EXCEL, header = true, delimiter } = options;
    const resolvedDelimiter = delimiter ?? getCsvDelimiter(dialect, ',');

    const normalizedRows = Array.from(data, row => {
        if (typeof row === 'object' && row !== null && 'toDict' in row && typeof row.toDict === 'function') {
            return row.toDict();
        }

        return row;
    });

    if (normalizedRows.length === 0) {
        return '';
    }

    const firstRow = normalizedRows[0];
    const output: string[] = [];

    if (!Array.isArray(firstRow)) {
        const resolvedFieldnames = fieldnames ?? Object.keys(firstRow);
        if (header) {
            output.push(
                resolvedFieldnames.map(value => escapeCsvValue(value, resolvedDelimiter)).join(resolvedDelimiter)
            );
        }

        for (const row of normalizedRows) {
            if (Array.isArray(row)) {
                output.push(row.map(value => escapeCsvValue(value, resolvedDelimiter)).join(resolvedDelimiter));
            } else {
                output.push(
                    resolvedFieldnames
                        .map(name => escapeCsvValue(row[name] ?? '', resolvedDelimiter))
                        .join(resolvedDelimiter)
                );
            }
        }

        return `${output.join('\n')}\n`;
    }

    for (const row of normalizedRows) {
        const values = Array.isArray(row) ? row : Object.values(row);
        output.push(values.map(value => escapeCsvValue(value, resolvedDelimiter)).join(resolvedDelimiter));
    }

    return `${output.join('\n')}\n`;
}

/**
 * Serialise data to a JSON string.
 *
 * `URL` instances anywhere in the value graph are converted to their string
 * representation via {@link EnhancedJSONEncoder.replacer} before serialisation.
 *
 * @param data - Value to serialise.
 * @param options - Indentation and ASCII-escaping options.
 * @returns The JSON string.
 *
 * @example
 * ```ts
 * writeJsonFile({ count: 3 });
 * // '{"count":3}'
 *
 * writeJsonFile({ symbol: 'é' }, { ensureAscii: true });
 * // '{"symbol":"\\u00e9"}'
 * ```
 */
export function writeJsonFile(data: unknown, options: WriteJsonFileOptions = {}): string {
    const { indent, ensureAscii = false } = options;
    const json = JSON.stringify(data, EnhancedJSONEncoder.replacer, indent ?? undefined);

    if (!ensureAscii) {
        return json;
    }

    let encoded = '';
    for (const character of json) {
        const codePoint = character.codePointAt(0) as number;
        if (codePoint > 127) {
            encoded += `\\u${codePoint.toString(16).padStart(4, '0')}`;
        } else {
            encoded += character;
        }
    }

    return encoded;
}

const createMemoryStorage = (): BrowserStorage => {
    const storage = new Map<string, string>();

    return {
        getItem(key: string): string | null {
            return storage.get(key) ?? null;
        },
        setItem(key: string, value: string): void {
            storage.set(key, value);
        },
        removeItem(key: string): void {
            storage.delete(key);
        }
    };
};

const getBrowserStorage = (): BrowserStorage => {
    const globalWithStorage = globalThis as typeof globalThis & { localStorage?: BrowserStorage };
    if (globalWithStorage.localStorage) {
        return globalWithStorage.localStorage;
    }

    return createMemoryStorage();
};

/**
 * Options for {@link createFileAdapter}.
 */
export interface CreateAdapterOptions {
    /**
     * Target runtime for the adapter.
     *
     * - `'node'`: uses `node:fs/promises`.
     * - `'browser'`: uses `localStorage` or an in-memory fallback.
     *
     * When omitted, the runtime is detected automatically.
     */
    runtime?: 'node' | 'browser';
    /** Custom storage backend for the browser adapter. Defaults to `localStorage` or an in-memory map. */
    storage?: BrowserStorage;
}

/**
 * Build a runtime-aware {@link FileAdapter} for persistence operations.
 *
 * The adapter is selected based on the `runtime` option or detected
 * automatically from the environment:
 * - **Node.js**: reads and writes using `node:fs/promises`.
 * - **Browser**: serialises content through `localStorage` (or an in-memory
 *   map when `localStorage` is unavailable).
 *
 * @param options - Runtime selection and browser storage overrides.
 * @returns A `FileAdapter` instance for the target environment.
 *
 * @example
 * ```ts
 * const adapter = createFileAdapter(); // auto-detected
 * const nodeAdapter = createFileAdapter({ runtime: 'node' });
 * const browserAdapter = createFileAdapter({ runtime: 'browser', storage: myStorage });
 * ```
 */
export function createFileAdapter(options: CreateAdapterOptions = {}): FileAdapter {
    const runtime = options.runtime ?? (isNodeRuntime() ? 'node' : 'browser');

    if (runtime === 'browser') {
        const storage = options.storage ?? getBrowserStorage();
        const keyFor = (path: string): string => `pactole:file:${path}`;

        return {
            async exists(path: string): Promise<boolean> {
                return storage.getItem(keyFor(path)) !== null;
            },
            async stat(path: string): Promise<FileAdapterStat> {
                const raw = storage.getItem(keyFor(path));
                if (!raw) {
                    throw new FileNotFoundError(`The file ${path} does not exist.`);
                }

                const payload = JSON.parse(raw) as BrowserFileEntry;
                return {
                    size: payload.size,
                    mtime: new Date(payload.updatedAt)
                };
            },
            async readText(path: string): Promise<string> {
                const raw = storage.getItem(keyFor(path));
                if (!raw) {
                    throw new FileNotFoundError(`The file ${path} does not exist.`);
                }

                const payload = JSON.parse(raw) as BrowserFileEntry;
                return payload.content;
            },
            async writeText(path: string, content: string): Promise<void> {
                const payload: BrowserFileEntry = {
                    content,
                    updatedAt: new Date().toISOString(),
                    size: content.length
                };
                storage.setItem(keyFor(path), JSON.stringify(payload));
            },
            async remove(path: string): Promise<void> {
                storage.removeItem(keyFor(path));
            },
            async ensureParentDirectory(): Promise<void> {
                // Browser storage is flat and does not need explicit directory creation.
            }
        };
    }

    return {
        async exists(path: string): Promise<boolean> {
            const fsModule = await import('node:fs/promises');
            try {
                await fsModule.access(path);
                return true;
            } catch {
                return false;
            }
        },
        async stat(path: string): Promise<FileAdapterStat> {
            const fsModule = await import('node:fs/promises');
            const stats = await fsModule.stat(path);
            return {
                size: stats.size,
                mtime: stats.mtime
            };
        },
        async readText(path: string, encoding: string): Promise<string> {
            const fsModule = await import('node:fs/promises');
            return await fsModule.readFile(path, { encoding: encoding as BufferEncoding });
        },
        async writeText(path: string, content: string, encoding: string): Promise<void> {
            const fsModule = await import('node:fs/promises');
            await fsModule.writeFile(path, content, { encoding: encoding as BufferEncoding });
        },
        async remove(path: string): Promise<void> {
            const fsModule = await import('node:fs/promises');
            await fsModule.unlink(path);
        },
        async ensureParentDirectory(path: string): Promise<void> {
            await ensureDirectory(path);
        }
    };
}

/**
 * Runtime file abstraction with type-aware read and write support.
 *
 * Handles `CSV`, `JSON`, and plain `TEXT` files transparently, delegating all
 * actual I/O to a {@link FileAdapter} so the same API works on both Node.js and
 * browser environments.
 *
 * @example
 * ```ts
 * const file = new File('/tmp/data.json');
 * await file.write({ key: 'value' });
 * const data = await file.read(); // { key: 'value' }
 * ```
 */
export class File {
    private readonly _path: string;

    private readonly _encoding: string;

    private readonly _type: FileType;

    private readonly _adapter: FileAdapter;

    /**
     * Create a new `File` instance.
     *
     * The file type is inferred from the path extension when `options.fileType`
     * is not provided. The persistence adapter is selected automatically based
     * on the current runtime when `options.adapter` is not provided.
     *
     * @param path - Path to the file (absolute on Node.js; logical key on browser).
     * @param options - Optional file type, encoding, and adapter overrides.
     */
    public constructor(path: string, options: FileOptions = {}) {
        this._path = path;
        this._encoding = options.encoding ?? 'utf-8';
        const pathParts = path.split('.');
        const extension = pathParts[pathParts.length - 1];
        this._type = getFileType(options.fileType ?? `.${extension}`);
        this._adapter = options.adapter ?? createFileAdapter();
    }

    /**
     * Absolute or logical path of this file.
     */
    public get path(): string {
        return this._path;
    }

    /**
     * Resolved {@link FileType} of this file.
     */
    public get type(): FileType {
        return this._type;
    }

    /**
     * Text encoding used when reading and writing this file.
     */
    public get encoding(): string {
        return this._encoding;
    }

    /**
     * Return whether this file exists in the underlying storage.
     *
     * @returns `true` when the file exists.
     */
    public async exists(): Promise<boolean> {
        return await this._adapter.exists(this._path);
    }

    /**
     * Return the last modification date of the file.
     *
     * @returns The modification `Date`.
     * @throws When the file does not exist or the adapter cannot stat the path.
     */
    public async date(): Promise<Date> {
        const stats = await this._adapter.stat(this._path);
        return stats.mtime;
    }

    /**
     * Return the file size in bytes.
     *
     * Returns `0` when the file does not exist.
     *
     * @returns The file size in bytes, or `0` if the file is absent.
     */
    public async size(): Promise<number> {
        if (!(await this.exists())) {
            return 0;
        }

        const stats = await this._adapter.stat(this._path);
        return stats.size;
    }

    /**
     * Read and parse the file content according to the file type.
     *
     * - `CSV`: returns `Record<string, string>[]`.
     * - `JSON`: returns the parsed value.
     * - `TEXT`: returns the raw string.
     *
     * @param options - Pass `{ throwOnError: false }` to receive `null` instead of
     *   throwing on a missing file or parse failure.
     * @returns The parsed content, or `null` when `throwOnError` is `false` and an
     *   error occurs.
     * @throws `FileNotFoundError` when the file does not exist and `throwOnError` is `true`.
     * @throws `Error` (with `cause`) on parse failures when `throwOnError` is `true`.
     */
    public async read(options: FileReadOptions = {}): Promise<unknown | null> {
        const { throwOnError = true } = options;
        if (!(await this.exists())) {
            if (throwOnError) {
                throw new FileNotFoundError(`The file ${this._path} does not exist.`);
            }
            return null;
        }

        try {
            const text = await this._adapter.readText(this._path, this._encoding);

            if (this._type === FileType.CSV) {
                return Array.from(readCsvFile(text));
            }

            if (this._type === FileType.JSON) {
                return JSON.parse(text) as unknown;
            }

            return text;
        } catch (error) {
            if (!throwOnError) {
                return null;
            }

            if (this._type === FileType.CSV) {
                throw new Error(`Failed to read CSV file: ${this._path}`, { cause: error });
            }

            if (this._type === FileType.JSON) {
                throw new Error(`Failed to read JSON file: ${this._path}`, { cause: error });
            }

            throw error;
        }
    }

    /**
     * Read the file content as a list of lines or rows.
     *
     * - `CSV`: returns the same array of row objects as {@link read}.
     * - `TEXT` / `JSON`: returns non-empty lines split on `\n` / `\r\n`.
     *
     * @param options - Pass `{ throwOnError: false }` to return an empty array
     *   instead of throwing on error.
     * @returns An array of lines or row objects, or `[]` on error when
     *   `throwOnError` is `false`.
     * @throws Same conditions as {@link read} when `throwOnError` is `true`.
     */
    public async readLines(options: FileReadOptions = {}): Promise<unknown[]> {
        const { throwOnError = true } = options;
        const content = await this.read({ throwOnError });

        if (content === null) {
            return [];
        }

        if (this._type === FileType.CSV) {
            return content as unknown[];
        }

        return String(content)
            .split(/\r?\n/u)
            .filter(line => line.length > 0);
    }

    /**
     * Write content to the file according to the file type.
     *
     * - `CSV`: `content` is serialised with {@link writeCsvFile}.
     * - `JSON`: `content` is serialised with {@link writeJsonFile}.
     * - `TEXT`: `content` is converted to a string with `String()`.
     *
     * The parent directory is created automatically when it does not exist.
     *
     * @param content - Value to write. The expected shape depends on the file type.
     * @param options - Pass `{ throwOnError: false }` to swallow write errors silently.
     * @throws `Error` (with `cause`) on write failures when `throwOnError` is `true`.
     */
    public async write(content: unknown, options: FileReadOptions = {}): Promise<void> {
        const { throwOnError = true } = options;

        try {
            await this._adapter.ensureParentDirectory(this._path);

            if (this._type === FileType.CSV) {
                const serialized = writeCsvFile(content as Iterable<Record<string, unknown> | string[]>);
                await this._adapter.writeText(this._path, serialized, this._encoding);
                return;
            }

            if (this._type === FileType.JSON) {
                const serialized = writeJsonFile(content);
                await this._adapter.writeText(this._path, serialized, this._encoding);
                return;
            }

            await this._adapter.writeText(this._path, String(content), this._encoding);
        } catch (error) {
            if (!throwOnError) {
                return;
            }

            if (this._type === FileType.CSV) {
                throw new Error(`Failed to write CSV file: ${this._path}`, { cause: error });
            }
            if (this._type === FileType.JSON) {
                throw new Error(`Failed to write JSON file: ${this._path}`, { cause: error });
            }

            throw error;
        }
    }

    /**
     * Delete the file from the underlying storage.
     *
     * @param options - Pass `{ throwOnError: false }` to swallow errors when the
     *   file does not exist or deletion fails.
     * @throws `FileNotFoundError` when the file does not exist and `throwOnError` is `true`.
     * @throws Whatever the adapter throws on removal failure when `throwOnError` is `true`.
     */
    public async delete(options: FileReadOptions = {}): Promise<void> {
        const { throwOnError = true } = options;
        if (!(await this.exists())) {
            if (throwOnError) {
                throw new FileNotFoundError(`The file ${this._path} does not exist.`);
            }

            return;
        }

        try {
            await this._adapter.remove(this._path);
        } catch (error) {
            if (throwOnError) {
                throw error;
            }
        }
    }
}
