import { EuroMillionsCombination, type CombinationFactory } from '../combinations/index.ts';
import { type DayInput } from '../utils/days.ts';
import { getEnvironmentValue, importNamespace } from '../utils/system.ts';
import { BaseLottery, type LotteryProvider } from './base-lottery.ts';

const DEFAULT_PROVIDER = 'pactole.data.providers.fdj.FDJProvider';
const DEFAULT_ARCHIVES_PAGE = 'euromillions-my-million';
const DEFAULT_DRAW_DAYS = 'TUESDAY,FRIDAY';
const DEFAULT_DRAW_DAY_REFRESH_TIME = '22:00';
const DEFAULT_CACHE_NAME = 'euromillions';

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
    const template = new EuroMillionsCombination();
    return ({ combination = null, components = {} } = {}) => template.getCombination({ combination, components });
};

/**
 * Class representing the EuroMillions lottery.
 *
 * EuroMillions is a lottery game where players choose 5 main numbers from 1 to
 * 50 and 2 star numbers from 1 to 12. The total number of combinations is
 * 2,118,760 for the main numbers and 66 for the star numbers. In total, there
 * are 139,838,160 possible combinations.
 *
 * Draws take place every Tuesday and Friday.
 *
 * @example
 * ```ts
 * const lottery = new EuroMillions();
 * lottery.drawDays; // DrawDays instance
 * lottery.combinationFactory; // EuroMillionsCombination factory
 * lottery.getCombination({ numbers: [1,2,3,4,5], stars: [1,2] });
 * ```
 */
export class EuroMillions extends BaseLottery {
    constructor(provider: LotteryProvider | null = null) {
        if (provider === null) {
            const providerClassName = getEnvironmentValue('EUROMILLIONS_PROVIDER_CLASS', DEFAULT_PROVIDER);
            const providerClass = importNamespace<ProviderConstructor>(providerClassName);
            const drawDays = parseDrawDays(getEnvironmentValue('EUROMILLIONS_DRAW_DAYS', DEFAULT_DRAW_DAYS));
            const drawDayRefreshTime = getEnvironmentValue(
                'EUROMILLIONS_DRAW_DAY_REFRESH_TIME',
                DEFAULT_DRAW_DAY_REFRESH_TIME
            );
            const cacheName = getEnvironmentValue('EUROMILLIONS_CACHE_NAME', DEFAULT_CACHE_NAME);
            const archivesPage = getEnvironmentValue('EUROMILLIONS_ARCHIVES_PAGE', DEFAULT_ARCHIVES_PAGE);

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
