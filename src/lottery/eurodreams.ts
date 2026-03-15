import { EuroDreamsCombination, type CombinationFactory } from '../combinations/index.ts';
import { type DayInput } from '../utils/days.ts';
import { getEnvironmentValue, importNamespace } from '../utils/system.ts';
import { BaseLottery, type LotteryProvider } from './base-lottery.ts';

const DEFAULT_PROVIDER = 'pactole.data.providers.fdj.FDJProvider';
const DEFAULT_ARCHIVES_PAGE = 'eurodreams';
const DEFAULT_DRAW_DAYS = 'MONDAY,THURSDAY';
const DEFAULT_DRAW_DAY_REFRESH_TIME = '22:00';
const DEFAULT_CACHE_NAME = 'eurodreams';

type ProviderConstructor = new (options: {
    resolver: string;
    drawDays: DayInput[];
    drawDayRefreshTime: string;
    combinationFactory: CombinationFactory;
    cacheName: string;
}) => LotteryProvider;

const parseDrawDays = (value: string): DayInput[] =>
    value
        .split(',')
        .map(day => day.trim())
        .filter(day => day.length > 0);

const createCombinationFactory = (): CombinationFactory => {
    const template = new EuroDreamsCombination();
    return ({ combination = null, components = {} } = {}) => template.getCombination({ combination, components });
};

/**
 * Class representing the EuroDreams lottery.
 *
 * EuroDreams is a lottery game where players choose 6 main numbers from 1 to 40
 * and 1 dream number from 1 to 5. The total number of combinations is
 * 3,838,380 for the main numbers and 5 for the dream numbers. In total, there
 * are 19,191,900 possible combinations.
 *
 * Draws take place every Monday and Thursday.
 *
 * @example
 * ```ts
 * const lottery = new EuroDreams();
 * lottery.drawDays; // DrawDays instance
 * lottery.combinationFactory; // EuroDreamsCombination factory
 * lottery.getCombination({ numbers: [1,2,3,4,5,6], dream: [1] });
 * ```
 */
export class EuroDreams extends BaseLottery {
    constructor(provider: LotteryProvider | null = null) {
        if (provider === null) {
            const providerClassName = getEnvironmentValue('EURODREAMS_PROVIDER_CLASS', DEFAULT_PROVIDER);
            const providerClass = importNamespace<ProviderConstructor>(providerClassName);
            const drawDays = parseDrawDays(getEnvironmentValue('EURODREAMS_DRAW_DAYS', DEFAULT_DRAW_DAYS));
            const drawDayRefreshTime = getEnvironmentValue(
                'EURODREAMS_DRAW_DAY_REFRESH_TIME',
                DEFAULT_DRAW_DAY_REFRESH_TIME
            );
            const cacheName = getEnvironmentValue('EURODREAMS_CACHE_NAME', DEFAULT_CACHE_NAME);
            const archivesPage = getEnvironmentValue('EURODREAMS_ARCHIVES_PAGE', DEFAULT_ARCHIVES_PAGE);

            provider = new providerClass({
                resolver: archivesPage,
                drawDays,
                drawDayRefreshTime,
                combinationFactory: createCombinationFactory(),
                cacheName
            });
        }

        super(provider);
    }
}
