[**pactole-js**](../../../README.md)

***

# Function: createWinningRanks()

> **createWinningRanks**(`entries`): [`CombinationWinningRanks`](../type-aliases/CombinationWinningRanks.md)

Defined in: [combinations/lottery-combination.ts:852](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/lottery-combination.ts#L852)

Build a winning-ranks map from tuple-like pattern entries.

## Parameters

### entries

\[[`CombinationWinningPattern`](../type-aliases/CombinationWinningPattern.md), `number`\][]

Array of `[pattern, rank]` pairs.

## Returns

[`CombinationWinningRanks`](../type-aliases/CombinationWinningRanks.md)

Encoded winning-rank map.

## Example

```ts
const ranks = createWinningRanks([[[5, 2], 1], [[5, 1], 2]]);
// => { "5,2": 1, "5,1": 2 }
```
