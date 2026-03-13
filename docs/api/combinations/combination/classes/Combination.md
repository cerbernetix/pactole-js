[**pactole-js**](../../../README.md)

***

# Class: Combination

Defined in: [combinations/combination.ts:82](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L82)

A class representing a combination of values.

The class stores unique values and exposes deterministic sorted values,
lexicographic rank helpers, set-style predicates, and ordering helpers.

## Param

The values of the combination.

## Param

The lexicographic rank of the combination.

## Param

The starting offset for combination values.

## Examples

```ts
const combination = new Combination([12, 3, 42, 6, 22]);
combination.values; // [3, 6, 12, 22, 42]
combination.rank; // 755560
```

```ts
const empty = new Combination();
empty.values; // []
empty.rank; // 0
```

## Extended by

- [`BoundCombination`](BoundCombination.md)

## Constructors

### Constructor

> **new Combination**(`values?`, `__namedParameters?`): `Combination`

Defined in: [combinations/combination.ts:91](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L91)

#### Parameters

##### values?

[`CombinationInputWithRank`](../../types/interfaces/CombinationInputWithRank.md) | [`CombinationInputValues`](../type-aliases/CombinationInputValues.md) | `null`

##### \_\_namedParameters?

[`CombinationOptions`](../interfaces/CombinationOptions.md) = `{}`

#### Returns

`Combination`

## Properties

### \_rank

> `protected` **\_rank**: `number` \| `null`

Defined in: [combinations/combination.ts:85](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L85)

***

### \_start

> `protected` `readonly` **\_start**: `number`

Defined in: [combinations/combination.ts:87](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L87)

***

### \_values

> `protected` `readonly` **\_values**: `Set`\<`number`\>

Defined in: [combinations/combination.ts:83](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L83)

## Accessors

### length

#### Get Signature

> **get** **length**(): `number`

Defined in: [combinations/combination.ts:180](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L180)

Get number of values.

##### Example

```ts
new Combination([3, 1, 2]).length; // 3
```

##### Returns

`number`

Number of unique values in the combination.

***

### rank

#### Get Signature

> **get** **rank**(): `number`

Defined in: [combinations/combination.ts:155](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L155)

Get lexicographic rank.

If rank is not explicitly provided, it is computed lazily from values.

##### Example

```ts
new Combination([3, 1, 2]).rank; // 0
```

##### Returns

`number`

Lexicographic rank.

***

### start

#### Get Signature

> **get** **start**(): `number`

Defined in: [combinations/combination.ts:192](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L192)

Get the starting offset of the combination.

##### Example

```ts
new Combination([3, 1, 2], null, 0).start; // 0
```

##### Returns

`number`

Start offset.

***

### storedRank

#### Get Signature

> **get** **storedRank**(): `number` \| `null`

Defined in: [combinations/combination.ts:168](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L168)

Get the stored rank without triggering lazy rank computation.

##### Returns

`number` \| `null`

Stored rank or `null` when it has not been set/computed yet.

***

### values

#### Get Signature

> **get** **values**(): [`CombinationValues`](../../types/type-aliases/CombinationValues.md)

Defined in: [combinations/combination.ts:137](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L137)

Get sorted combination values.

##### Example

```ts
new Combination([3, 1, 2]).values; // [1, 2, 3]
```

##### Returns

[`CombinationValues`](../../types/type-aliases/CombinationValues.md)

Sorted values.

## Methods

### \[iterator\]()

> **\[iterator\]**(): `Iterator`\<`number`\>

Defined in: [combinations/combination.ts:444](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L444)

#### Returns

`Iterator`\<`number`\>

***

### compares()

> **compares**(`combination`): `number`

Defined in: [combinations/combination.ts:358](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L358)

Compare this combination to another combination or rank.

#### Parameters

##### combination

[`CombinationInput`](../type-aliases/CombinationInput.md)

Candidate combination/rank.

#### Returns

`number`

`-1`, `0`, or `1`.

#### Example

```ts
new Combination([1, 2, 3]).compares([1, 2, 4]); // -1
```

***

### copy()

> **copy**(`values?`): `Combination`

Defined in: [combinations/combination.ts:209](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L209)

Return a copy with optional modifications.

#### Parameters

##### values?

[`CombinationCopyOptions`](../interfaces/CombinationCopyOptions.md) = `{}`

Replacement values. `null` keeps current values. If an integer is provided,
it is treated as the lexicographic rank of the combination.

#### Returns

`Combination`

A new `Combination`.

#### Example

```ts
const base = new Combination([4, 5, 6], { start: 1 });
base.copy({ values: [2, 3, 4] }).values; // [2, 3, 4]
```

***

### equals()

> **equals**(`combination`): `boolean`

Defined in: [combinations/combination.ts:257](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L257)

Check whether this combination equals another combination or rank.

#### Parameters

##### combination

[`CombinationInput`](../type-aliases/CombinationInput.md)

Candidate combination/rank.

#### Returns

`boolean`

`true` when values/rank are equal.

#### Example

```ts
const base = new Combination([1, 2, 3]);
base.equals([1, 2, 3]); // true
base.equals(0); // true
```

***

### get()

> **get**(`index`): `number`

Defined in: [combinations/combination.ts:408](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L408)

Get a value by index.

#### Parameters

##### index

`number`

Zero-based value index.

#### Returns

`number`

Value at index.

#### Throws

Thrown when index is out of bounds.

***

### getValues()

> **getValues**(`start?`): [`CombinationValues`](../../types/type-aliases/CombinationValues.md)

Defined in: [combinations/combination.ts:237](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L237)

Get values with an optional start offset transformation.

#### Parameters

##### start?

`number`

Optional target start offset.

#### Returns

[`CombinationValues`](../../types/type-aliases/CombinationValues.md)

Values adjusted to the requested start offset.

#### Example

```ts
new Combination([1, 2, 3]).getValues(0); // [0, 1, 2]
```

***

### hashCode()

> **hashCode**(): `number`

Defined in: [combinations/combination.ts:424](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L424)

Get an integer hash representation.

#### Returns

`number`

Rank-based hash.

#### Example

```ts
new Combination([1, 2, 3]).hashCode(); // 0
```

***

### includes()

> **includes**(`combination`): `boolean`

Defined in: [combinations/combination.ts:292](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L292)

Check whether this combination includes another combination or a value.

#### Parameters

##### combination

Candidate value(s).

`number` | [`CombinationInputValues`](../type-aliases/CombinationInputValues.md) | `null` | `undefined`

#### Returns

`boolean`

`true` when all candidate values are included.

#### Example

```ts
const base = new Combination([2, 4, 6]);
base.includes(4); // true
base.includes([2, 5]); // false
```

***

### intersection()

> **intersection**(`combination`): `Combination`

Defined in: [combinations/combination.ts:340](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L340)

Get the intersection with another combination.

#### Parameters

##### combination

Candidate value(s).

[`CombinationInputValues`](../type-aliases/CombinationInputValues.md) | `null` | `undefined`

#### Returns

`Combination`

A new `Combination` containing shared values.

#### Example

```ts
new Combination([1, 2, 3]).intersection([3, 4, 5]).values; // [3]
```

***

### intersects()

> **intersects**(`combination`): `boolean`

Defined in: [combinations/combination.ts:318](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L318)

Check whether this combination intersects another combination.

#### Parameters

##### combination

Candidate value(s).

[`CombinationInputValues`](../type-aliases/CombinationInputValues.md) | `null` | `undefined`

#### Returns

`boolean`

`true` when at least one value overlaps.

#### Example

```ts
new Combination([1, 2, 3]).intersects([3, 4]); // true
```

***

### similarity()

> **similarity**(`combination`): `number`

Defined in: [combinations/combination.ts:388](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L388)

Calculate similarity ratio with another combination.

#### Parameters

##### combination

Candidate values.

[`CombinationInputValues`](../type-aliases/CombinationInputValues.md) | `null` | `undefined`

#### Returns

`number`

Similarity ratio in `[0, 1]`.

#### Example

```ts
new Combination([1, 2, 3]).similarity([2, 3, 4]); // 0.666...
```

***

### toRepr()

> **toRepr**(): `string`

Defined in: [combinations/combination.ts:436](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L436)

Return a string representation.

#### Returns

`string`

Representation string.

#### Example

```ts
new Combination([1, 2, 3]).toRepr();
```

***

### toString()

> **toString**(): `string`

Defined in: [combinations/combination.ts:440](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/combinations/combination.ts#L440)

#### Returns

`string`
