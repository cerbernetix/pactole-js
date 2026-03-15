import { EuroMillionsCombination, type CombinationFactory } from 'src/combinations/index.ts';
import { EuroMillions } from 'src/lottery/index.ts';
import { DrawDays } from 'src/utils/index.ts';
import { clearNamespaceRegistry, registerNamespace } from 'src/utils/system.ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ProviderOptions = {
    resolver: string;
    drawDays: string[];
    drawDayRefreshTime: string;
    combinationFactory: CombinationFactory;
    cacheName: string;
};

const instances: DummyProvider[] = [];

class DummyProvider {
    public readonly drawDays: DrawDays;

    public readonly combinationFactory: CombinationFactory;

    public readonly options: ProviderOptions;

    public readonly loadCalls: boolean[] = [];

    public constructor(options: ProviderOptions) {
        this.options = options;
        this.drawDays = new DrawDays([]);
        this.combinationFactory = options.combinationFactory;
        instances.push(this);
    }

    public async load(force = false): Promise<never[]> {
        this.loadCalls.push(force);
        return [];
    }

    public async loadRaw(): Promise<Record<string, unknown>[]> {
        return [];
    }
}

beforeEach(() => {
    clearNamespaceRegistry();
    instances.length = 0;
});

afterEach(() => {
    vi.unstubAllEnvs();
    clearNamespaceRegistry();
});

describe('EuroMillions', () => {
    it('uses default provider wiring', async () => {
        registerNamespace('pactole.data.providers.fdj', { FDJProvider: DummyProvider });

        const lottery = new EuroMillions();

        expect(instances).toHaveLength(1);
        expect(instances[0]?.options.resolver).toBe('euromillions-my-million');
        expect(instances[0]?.options.drawDays).toEqual(['TUESDAY', 'FRIDAY']);
        expect(instances[0]?.options.drawDayRefreshTime).toBe('22:00');
        expect(instances[0]?.options.cacheName).toBe('euromillions');

        const sample = instances[0]?.options.combinationFactory({
            components: {
                numbers: [1, 2, 3, 4, 5],
                stars: [1, 2]
            }
        });
        expect(sample).toBeInstanceOf(EuroMillionsCombination);

        await lottery.get_records(true);
        expect(instances[0]?.loadCalls).toEqual([true]);
    });

    it('uses env overrides for provider defaults', async () => {
        registerNamespace('custom.provider', { DummyProvider });
        vi.stubEnv('EUROMILLIONS_PROVIDER_CLASS', 'custom.provider.DummyProvider');
        vi.stubEnv('EUROMILLIONS_DRAW_DAYS', 'SATURDAY,SUNDAY');
        vi.stubEnv('EUROMILLIONS_DRAW_DAY_REFRESH_TIME', '21:15');
        vi.stubEnv('EUROMILLIONS_CACHE_NAME', 'custom-cache');
        vi.stubEnv('EUROMILLIONS_ARCHIVES_PAGE', 'custom-page');

        const lottery = new EuroMillions();

        expect(instances).toHaveLength(1);
        expect(instances[0]?.options.resolver).toBe('custom-page');
        expect(instances[0]?.options.drawDays).toEqual(['SATURDAY', 'SUNDAY']);
        expect(instances[0]?.options.drawDayRefreshTime).toBe('21:15');
        expect(instances[0]?.options.cacheName).toBe('custom-cache');

        const sample = instances[0]?.options.combinationFactory({
            components: {
                numbers: [1, 2, 3, 4, 5],
                stars: [1, 2]
            }
        });
        expect(sample).toBeInstanceOf(EuroMillionsCombination);

        await lottery.get_records();
        expect(instances[0]?.loadCalls).toEqual([false]);
    });

    it('uses provided provider without default namespace import', async () => {
        const provided = new DummyProvider({
            resolver: 'provided',
            drawDays: [],
            drawDayRefreshTime: '22:00',
            combinationFactory: ({ components = {} } = {}) =>
                new EuroMillionsCombination({
                    numbers: components.numbers,
                    stars: components.stars
                }),
            cacheName: 'provided'
        });
        instances.length = 0;

        const lottery = new EuroMillions(provided);

        expect(instances).toHaveLength(0);

        await lottery.get_records(true);
        expect(provided.loadCalls).toEqual([true]);
    });
});
