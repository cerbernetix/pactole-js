[**pactole-js**](../../../README.md)

***

# Function: comb()

> **comb**(`n`, `k`): `number`

Defined in: [combinations/rank.ts:34](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/rank.ts#L34)

Cached computation of the binomial coefficient (`n` choose `k`).

## Parameters

### n

`number`

The total number of items.

### k

`number`

The number of items to choose.

## Returns

`number`

The number of combinations (`n` choose `k`).

## Throws

Thrown when `n` or `k` is negative or not an integer.

## Examples

```ts
`comb(5, 2) // 10`
```

```ts
`comb(10, 3) // 120`
```
