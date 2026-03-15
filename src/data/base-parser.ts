import { LotteryCombination, type CombinationFactory } from '../combinations/index.ts';
import { DrawRecord } from './models.ts';

/**
 * Base class for lottery data parsers.
 *
 * Subclasses should implement {@link parse} and transform a raw source row
 * into a {@link DrawRecord}. This class only provides normalized factory
 * wiring shared by concrete parsers.
 *
 * @example
 * ```ts
 * class CsvParser extends BaseParser {
 *   public override parse(data: Record<string, unknown>): DrawRecord {
 *     return DrawRecord.fromDict(data, this.combinationFactory);
 *   }
 * }
 * ```
 */
export class BaseParser {
    protected readonly _combinationFactory: CombinationFactory;

    /**
     * @param combinationFactory - Factory input used to build lottery combinations while parsing.
     */
    public constructor(combinationFactory: CombinationFactory | LotteryCombination | unknown = null) {
        this._combinationFactory = LotteryCombination.getCombinationFactory(combinationFactory);
    }

    /**
     * Parse a row payload into a draw record.
     *
     * Subclasses must override this method.
     *
     * @param data - Raw payload data.
     * @returns A parsed draw record.
     * @throws {Error} Thrown when the method is not implemented by a subclass.
     *
     * @example
     * ```ts
     * const parser = new BaseParser();
     * parser.parse({});
     * ```
     */
    public parse(data: Record<string, unknown>): DrawRecord {
        void data;
        throw new Error('Subclasses must implement method parse.');
    }

    /**
     * Combination factory used by this parser.
     *
     * @returns Normalized combination factory.
     */
    public get combinationFactory(): CombinationFactory {
        return this._combinationFactory;
    }
}
