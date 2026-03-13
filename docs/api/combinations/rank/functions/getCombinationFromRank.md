[**pactole-js**](../../../README.md)

***

# Function: getCombinationFromRank()

> **getCombinationFromRank**(`rank`, `length?`, `offset?`): `number`[]

Defined in: [combinations/rank.ts:118](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/rank.ts#L118)

Get the combination corresponding to a given lexicographic rank.

Values are returned sorted, and `offset` is added to each value in the resulting combination.

## Parameters

### rank

`number`

The lexicographic rank of the combination.

### length?

`number` = `2`

The length of the combination.

### offset?

`number` = `0`

An offset to apply to each value in the combination.

## Returns

`number`[]

The combination corresponding to the lexicographic rank.

## Throws

Thrown when `rank` or `length` is negative or not an integer.

## Examples

```ts
`getCombinationFromRank(0, 3) // [0, 1, 2]`
```

```ts
`getCombinationFromRank(2, 3) // [0, 2, 3]`
```

```ts
`getCombinationFromRank(0, 3, 1) // [1, 2, 3]`
```
