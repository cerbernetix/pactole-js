import { afterEach, describe, expect, it, vi } from 'vitest';

import { LotteryCombination, type CombinationFactory } from 'src/combinations/index.ts';
import { BaseParser, BaseResolver, DrawRecord, FDJParser, FDJProvider, FDJResolver } from 'src/data/index.ts';
import * as fileUtils from 'src/utils/file.ts';

const isoDate = (value: Date): string => value.toISOString().slice(0, 10);

const getValuesFromComponent = (component: unknown): number[] => {
    if (Array.isArray(component)) {
        return component;
    }

    if (
        typeof component === 'object' &&
        component !== null &&
        'values' in component &&
        Array.isArray((component as { values?: unknown }).values)
    ) {
        return (component as { values: number[] }).values;
    }

    return [];
};

describe('FDJResolver', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        delete process.env.FDJ_ARCHIVES_PAGE_URL;
    });

    it('builds archive URLs using the default template', () => {
        expect(FDJResolver.getArchivesPageUrl('euromillions-my-million')).toBe(
            'https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/historique'
        );
    });

    it('builds archive URLs using the env template override', () => {
        process.env.FDJ_ARCHIVES_PAGE_URL = 'https://local.test/archives/{name}/history';

        expect(FDJResolver.getArchivesPageUrl('eurodreams')).toBe('https://local.test/archives/eurodreams/history');
    });

    it('falls back to class template when process is unavailable', () => {
        const originalProcess = globalThis.process;

        Reflect.deleteProperty(globalThis, 'process');

        try {
            expect(FDJResolver.getArchivesPageUrl('eurodreams')).toBe(
                'https://www.fdj.fr/jeux-de-tirage/eurodreams/historique'
            );
        } finally {
            globalThis.process = originalProcess;
        }
    });

    it('requires the {name} placeholder in the URL template', () => {
        process.env.FDJ_ARCHIVES_PAGE_URL = 'https://local.test/archives';

        expect(() => FDJResolver.getArchivesPageUrl('eurodreams')).toThrow("It must contain the placeholder '{name}'.");
    });

    it('extracts download links from the archives page', async () => {
        const html =
            '<html><body>' +
            '<a download="archive_202401" href="https://local.test/a.csv"></a>' +
            '<a download="archive_202402" href="https://local.test/b.csv"></a>' +
            '</body></html>';

        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(html);

        const resolver = new FDJResolver('https://local.test/archives');

        await expect(resolver.load()).resolves.toEqual({
            archive_202401: 'https://local.test/a.csv',
            archive_202402: 'https://local.test/b.csv'
        });
        expect(fileUtils.fetchContent).toHaveBeenCalledWith('https://local.test/archives');
    });

    it('ignores anchor entries without attributes or with missing download/href fields', async () => {
        const html =
            '<html><body>' +
            '<a></a>' +
            '<a download="archive_202401"></a>' +
            '<a href="https://local.test/b.csv"></a>' +
            '<a download="archive_202402" href="https://local.test/c.csv"></a>' +
            '</body></html>';

        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(html);

        const resolver = new FDJResolver('https://local.test/archives');

        await expect(resolver.load()).resolves.toEqual({
            archive_202402: 'https://local.test/c.csv'
        });
    });

    it('returns an empty map when fetched content is binary', async () => {
        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue(new Uint8Array([1, 2, 3]));

        const resolver = new FDJResolver('https://local.test/archives');

        await expect(resolver.load()).resolves.toEqual({});
    });

    it('accepts a lottery name and resolves it through the URL template', async () => {
        vi.spyOn(fileUtils, 'fetchContent').mockResolvedValue('<html><body></body></html>');

        const resolver = new FDJResolver('euromillions-my-million');

        await expect(resolver.load()).resolves.toEqual({});
        expect(fileUtils.fetchContent).toHaveBeenCalledWith(
            'https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/historique'
        );
    });
});

describe('FDJParser', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('normalizes supported date formats', () => {
        const combinationFactory: CombinationFactory = () => new LotteryCombination({ winningRanks: { '5,0': 1 } });
        const parser = new FDJParser(combinationFactory);

        const baseData = {
            date_de_forclusion: '2024-02-15',
            boule_1: '1',
            boule_2: '2',
            boule_3: '3',
            boule_4: '4',
            boule_5: '5'
        };

        const recordIso = parser.parse({ date_de_tirage: '2024-02-01', ...baseData });
        const recordRfc = parser.parse({ date_de_tirage: '20240201', ...baseData });
        const recordFr = parser.parse({ date_de_tirage: '01/02/24', ...baseData });

        expect(isoDate(recordIso.drawDate)).toBe('2024-02-01');
        expect(isoDate(recordRfc.drawDate)).toBe('2024-02-01');
        expect(isoDate(recordFr.drawDate)).toBe('2024-02-01');
    });

    it('builds a draw record with numbers and winning ranks', () => {
        const captured: Record<string, number[]> = {};
        const combinationFactory: CombinationFactory = ({ components = {} } = {}) => {
            for (const [componentName, component] of Object.entries(components)) {
                captured[componentName] = getValuesFromComponent(component);
            }

            return new LotteryCombination({ winningRanks: { '5,1': 1, '5,0': 2 } });
        };

        const parser = new FDJParser(combinationFactory);

        const record = parser.parse({
            date_de_tirage: '01/02/24',
            date_de_forclusion: '20240215',
            boule_1: '1',
            boule_2: '2',
            boule: '3',
            etoile_1: '9',
            etoile_2: '10',
            numero_dream: '7',
            ignored_field: 'noop',
            nombre_de_gagnant_au_rang1_en_france: '123',
            rapport_du_rang1_en_france: '999999.0',
            nombre_de_gagnant_au_rang1_en_europe: '2',
            rapport_du_rang1: '1000000.0',
            nombre_de_gagnant_au_rang2: '4',
            rapport_du_rang2: '50000.0'
        });

        expect(isoDate(record.drawDate)).toBe('2024-02-01');
        expect(isoDate(record.deadlineDate)).toBe('2024-02-15');
        expect(captured).toEqual({
            numbers: [1, 2, 3],
            stars: [9, 10],
            dream: [7]
        });
        expect(record.numbers).toEqual(captured);
        expect(record.winningRanks.map(rank => [rank.rank, rank.winners, rank.gain])).toEqual([
            [1, 2, 1000000],
            [2, 4, 50000]
        ]);
    });

    it('keeps the first winners and gains for duplicate keys', () => {
        const captured: Record<string, number[]> = {};
        const combinationFactory: CombinationFactory = ({ components = {} } = {}) => {
            for (const [componentName, component] of Object.entries(components)) {
                captured[componentName] = getValuesFromComponent(component);
            }

            return new LotteryCombination({ winningRanks: { '5,0': 1, '4,0': 2 } });
        };

        const parser = new FDJParser(combinationFactory);
        const record = parser.parse({
            date_de_tirage: '2024-02-01',
            date_de_forclusion: '2024-02-15',
            bonus_1: '8',
            nombre_de_gagnant_au_rang1_en_france: '5',
            nombre_de_gagnant_au_rang1_en_europe: '2',
            nombre_de_gagnant_au_rang1: '99',
            rapport_du_rang1: '100.0',
            rapport_du_rang1_en_france: '50.0',
            rapport_du_rang1_en_europe: '999.0'
        });

        expect(record.numbers).toEqual({ bonus: [8] });
        expect(captured).toEqual({ bonus: [8] });
        expect(record.winningRanks.map(rank => [rank.rank, rank.winners, rank.gain])).toEqual([
            [1, 2, 100],
            [2, 0, 0]
        ]);
    });

    it('discards all *_en_france columns', () => {
        const combinationFactory: CombinationFactory = () => new LotteryCombination({ winningRanks: { '5,0': 1 } });
        const parser = new FDJParser(combinationFactory);

        const record = parser.parse({
            date_de_tirage: '2024-03-01',
            date_de_forclusion: '2024-03-15',
            boule_1: '5',
            nombre_de_gagnant_au_rang1_en_france: '42',
            rapport_du_rang1_en_france: '123456.0',
            nombre_de_gagnant_au_rang1: '3',
            rapport_du_rang1: '700.0'
        });

        expect(record.winningRanks.map(rank => [rank.rank, rank.winners, rank.gain])).toEqual([[1, 3, 700]]);
    });

    it('returns no winning ranks when the combination has no winning-rank bounds', () => {
        const combinationFactory: CombinationFactory = () => new LotteryCombination();
        const parser = new FDJParser(combinationFactory);

        const record = parser.parse({
            date_de_tirage: '2024-02-01',
            date_de_forclusion: '2024-02-15',
            boule_1: '1',
            boule_2: '2'
        });

        expect(record.winningRanks).toEqual([]);
    });

    it('uses default dates when source date fields are missing', () => {
        const combinationFactory: CombinationFactory = () => new LotteryCombination();
        const parser = new FDJParser(combinationFactory);

        const record = parser.parse({});

        expect(isoDate(record.drawDate)).toBe('1970-01-01');
        expect(isoDate(record.deadlineDate)).toBe('1970-01-01');
    });
});

describe('FDJProvider', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('accepts a resolver URL', () => {
        const provider = new FDJProvider({ resolver: 'https://local.test/archives' });

        expect(provider).toBeInstanceOf(FDJProvider);
    });

    it('forwards drawDayRefreshTime to the base provider', () => {
        const provider = new FDJProvider({
            resolver: 'https://local.test/archives',
            drawDayRefreshTime: '21:30'
        });

        expect(provider.drawDayRefreshTime.getHours()).toBe(21);
        expect(provider.drawDayRefreshTime.getMinutes()).toBe(30);
    });

    it('accepts resolver and parser instances', () => {
        class SampleResolver extends BaseResolver {
            protected override _loadCache(): Record<string, string> {
                return {};
            }
        }

        class SampleParser extends BaseParser {
            public override parse(data: Record<string, unknown>): DrawRecord {
                void data;
                return DrawRecord.fromDict({});
            }
        }

        const provider = new FDJProvider({ resolver: new SampleResolver(), parser: new SampleParser() });

        expect(provider).toBeInstanceOf(FDJProvider);
    });
});
