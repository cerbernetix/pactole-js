[**pactole-js**](../../../README.md)

***

# Function: getCombinationRank()

> **getCombinationRank**(`combination`, `offset?`): `number`

Defined in: [combinations/rank.ts:81](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/rank.ts#L81)

Get the lexicographic rank of a given combination.

Values are sorted before computing rank, and `offset` is subtracted from
each value during ranking.

## Parameters

### combination

`Iterable`\<`number`\>

The combination to get the lexicographic rank for.

### offset?

`number` = `0`

An offset to apply to each value in the combination.

## Returns

`number`

The lexicographic rank of the combination.

## Examples

```ts
`getCombinationRank([0, 1, 2]) // 0`
```

```ts
`getCombinationRank([0, 2, 3]) // 2`
```

```ts
`getCombinationRank([1, 2, 3], 1) // 0`
```
