import { describe, expect, it } from 'vitest';

import { LotteryCombination } from 'src/combinations/index.ts';
import { BaseParser } from 'src/data/index.ts';

describe('BaseParser', () => {
    it('defaults to a LotteryCombination factory', () => {
        const parser = new BaseParser();

        const combination = parser.combinationFactory();

        expect(combination).toBeInstanceOf(LotteryCombination);
    });

    it('stores custom factory through the property', () => {
        const buildCombination = (): LotteryCombination => new LotteryCombination();

        const parser = new BaseParser(buildCombination);

        expect(parser.combinationFactory).toBe(buildCombination);
    });

    it('raises when parse is not implemented', () => {
        const parser = new BaseParser();

        expect(() => parser.parse({ date: '2024-01-01' })).toThrow('Subclasses must implement method parse.');
    });

    it('supports parser subclass parse implementation', () => {
        class SampleParser extends BaseParser {
            public override parse(data: Record<string, unknown>) {
                return {
                    period: String(data.period ?? '202401')
                } as unknown as ReturnType<BaseParser['parse']>;
            }
        }

        const parser = new SampleParser();

        expect(parser.parse({ period: '202402' }).period).toBe('202402');
    });
});
