import { EuroMillionsCombination, type CombinationFactory } from '../combinations/index.ts';
import { Weekday } from '../utils/days.ts';
import { BaseLottery } from './base-lottery.ts';

// helper alias for the optional argument type of the factory
type FactoryOpts = Parameters<CombinationFactory>[0];

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
    constructor() {
        super({
            drawDays: [Weekday.TUESDAY, Weekday.FRIDAY],
            combinationFactory: (opts: FactoryOpts = {}) => {
                const comps = (opts as { components?: Record<string, unknown> }).components || {};
                return new EuroMillionsCombination({
                    numbers: (comps as { numbers?: unknown }).numbers as unknown as number[],
                    stars: (comps as { stars?: unknown }).stars as unknown as number[]
                });
            }
        });
    }
}
