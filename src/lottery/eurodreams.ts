import { EuroDreamsCombination, type CombinationFactory } from '../combinations/index.ts';
import { Weekday } from '../utils/days.ts';
import { BaseLottery } from './base-lottery.ts';

// helper alias for the optional argument type of the factory
type FactoryOpts = Parameters<CombinationFactory>[0];

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
    constructor() {
        super({
            drawDays: [Weekday.MONDAY, Weekday.THURSDAY],
            combinationFactory: (opts: FactoryOpts = {}) => {
                const comps = (opts as { components?: Record<string, unknown> }).components || {};
                return new EuroDreamsCombination({
                    numbers: (comps as { numbers?: unknown }).numbers as unknown as number[],
                    dream: (comps as { dream?: unknown }).dream as unknown as number[]
                });
            }
        });
    }
}
