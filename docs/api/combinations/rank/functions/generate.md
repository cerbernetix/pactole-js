[**pactole-js**](../../../README.md)

***

# Function: generate()

> **generate**(`combinations`, `n?`, `partitions?`): `Generator`\<`number`, `void`, `unknown`\>

Defined in: [combinations/rank.ts:171](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/rank.ts#L171)

Generate random combination ranks.

## Parameters

### combinations

`number`

The total number of possible combinations.

### n?

`number` = `1`

The number of random combinations to generate.

### partitions?

`number` = `1`

The number of partitions to divide the combinations into for random selection.

## Returns

`Generator`\<`number`, `void`, `unknown`\>

A generator yielding random combination ranks.

## Example

```ts
`Array.from(generate(100, 5, 10)) // [3, 27, 45, 88, 12]`
```
