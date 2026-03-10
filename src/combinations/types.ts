export type CombinationRank = number;

export type CombinationNumber = number;

export type CombinationNumbers = Iterable<CombinationNumber>;

export type CombinationValues = CombinationNumber[];

export interface CombinationInputWithRank {
    values?: CombinationNumbers | null;
    rank?: CombinationRank | null;
}
