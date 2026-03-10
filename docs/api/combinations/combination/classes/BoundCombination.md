[**pactole-js**](../../../README.md)

***

# Class: BoundCombination

Defined in: [combinations/combination.ts:471](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L471)

A class representing a bound combination of values.

`BoundCombination` extends `Combination` with numeric bounds and a fixed
component count used by lottery sub-components.

## Param

The values of the combination. If an integer is provided, it is treated as a rank.

## Param

The lexicographic rank of the combination.

## Param

The start value of the combination range.

## Param

The end value of the combination range.

## Param

The maximum count of numbers in the combination.

## Param

The total number of possible combinations.

## Examples

```ts
const bound = new BoundCombination(10, { start: 1, end: 50, count: 5 });
bound.values; // e.g. [2, 3, 4, 5, 7]
```

```ts
const fixed = new BoundCombination([1, 2, 3], { start: 1, end: 50, count: 5 });
fixed.count; // 5
fixed.combinations; // 2118760
```

## Extends

- [`Combination`](Combination.md)

## Constructors

### Constructor

> **new BoundCombination**(`values?`, `__namedParameters?`): `BoundCombination`

Defined in: [combinations/combination.ts:478](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L478)

#### Parameters

##### values?

[`CombinationInputOrRank`](../type-aliases/CombinationInputOrRank.md) = `null`

##### \_\_namedParameters?

[`BoundCombinationOptions`](../interfaces/BoundCombinationOptions.md) = `{}`

#### Returns

`BoundCombination`

#### Overrides

[`Combination`](Combination.md).[`constructor`](Combination.md#constructor)

## Properties

### \_combinations

> `protected` `readonly` **\_combinations**: `number`

Defined in: [combinations/combination.ts:476](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L476)

***

### \_count

> `protected` `readonly` **\_count**: `number`

Defined in: [combinations/combination.ts:474](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L474)

***

### \_end

> `protected` `readonly` **\_end**: `number`

Defined in: [combinations/combination.ts:472](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L472)

***

### \_rank

> `protected` **\_rank**: `number` \| `null`

Defined in: [combinations/combination.ts:85](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L85)

#### Inherited from

[`Combination`](Combination.md).[`_rank`](Combination.md#_rank)

***

### \_start

> `protected` `readonly` **\_start**: `number`

Defined in: [combinations/combination.ts:87](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L87)

#### Inherited from

[`Combination`](Combination.md).[`_start`](Combination.md#_start)

***

### \_values

> `protected` `readonly` **\_values**: `Set`\<`number`\>

Defined in: [combinations/combination.ts:83](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L83)

#### Inherited from

[`Combination`](Combination.md).[`_values`](Combination.md#_values)

## Accessors

### combinations

#### Get Signature

> **get** **combinations**(): `number`

Defined in: [combinations/combination.ts:560](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L560)

Return the total number of possible combinations.

##### Example

```ts
new BoundCombination([1, 2, 3], null, 1, 50, 5).combinations; // 2118760
```

##### Returns

`number`

Total combinatorial space.

***

### count

#### Get Signature

> **get** **count**(): `number`

Defined in: [combinations/combination.ts:548](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L548)

Return the configured count of numbers in the combination.

##### Example

```ts
new BoundCombination([1, 2, 3], null, 1, 50, 5).count; // 5
```

##### Returns

`number`

Configured count.

***

### end

#### Get Signature

> **get** **end**(): `number`

Defined in: [combinations/combination.ts:536](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L536)

Return the end value of the combination range.

##### Example

```ts
new BoundCombination([1, 2, 3], null, 1, 50, 5).end; // 50
```

##### Returns

`number`

End bound.

***

### length

#### Get Signature

> **get** **length**(): `number`

Defined in: [combinations/combination.ts:180](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L180)

Get number of values.

##### Example

```ts
new Combination([3, 1, 2]).length; // 3
```

##### Returns

`number`

Number of unique values in the combination.

#### Inherited from

[`Combination`](Combination.md).[`length`](Combination.md#length)

***

### rank

#### Get Signature

> **get** **rank**(): `number`

Defined in: [combinations/combination.ts:155](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L155)

Get lexicographic rank.

If rank is not explicitly provided, it is computed lazily from values.

##### Example

```ts
new Combination([3, 1, 2]).rank; // 0
```

##### Returns

`number`

Lexicographic rank.

#### Inherited from

[`Combination`](Combination.md).[`rank`](Combination.md#rank)

***

### start

#### Get Signature

> **get** **start**(): `number`

Defined in: [combinations/combination.ts:192](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L192)

Get the starting offset of the combination.

##### Example

```ts
new Combination([3, 1, 2], null, 0).start; // 0
```

##### Returns

`number`

Start offset.

#### Inherited from

[`Combination`](Combination.md).[`start`](Combination.md#start)

***

### storedRank

#### Get Signature

> **get** **storedRank**(): `number` \| `null`

Defined in: [combinations/combination.ts:168](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L168)

Get the stored rank without triggering lazy rank computation.

##### Returns

`number` \| `null`

Stored rank or `null` when it has not been set/computed yet.

#### Inherited from

[`Combination`](Combination.md).[`storedRank`](Combination.md#storedrank)

***

### values

#### Get Signature

> **get** **values**(): [`CombinationValues`](../../types/type-aliases/CombinationValues.md)

Defined in: [combinations/combination.ts:137](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L137)

Get sorted combination values.

##### Example

```ts
new Combination([3, 1, 2]).values; // [1, 2, 3]
```

##### Returns

[`CombinationValues`](../../types/type-aliases/CombinationValues.md)

Sorted values.

#### Inherited from

[`Combination`](Combination.md).[`values`](Combination.md#values)

## Methods

### \[iterator\]()

> **\[iterator\]**(): `Iterator`\<`number`\>

Defined in: [combinations/combination.ts:444](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L444)

#### Returns

`Iterator`\<`number`\>

#### Inherited from

[`Combination`](Combination.md).[`[iterator]`](Combination.md#iterator)

***

### compares()

> **compares**(`combination`): `number`

Defined in: [combinations/combination.ts:358](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L358)

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

#### Inherited from

[`Combination`](Combination.md).[`compares`](Combination.md#compares)

***

### copy()

> **copy**(`values?`): `BoundCombination`

Defined in: [combinations/combination.ts:594](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L594)

Return a copy of the BoundCombination with optional modifications.

#### Parameters

##### values?

[`BoundCombinationCopyOptions`](../interfaces/BoundCombinationCopyOptions.md) = `{}`

Replacement values, rank, or input-with-rank payload.

#### Returns

`BoundCombination`

A new `BoundCombination`.

#### Example

```ts
const base = new BoundCombination([1, 2, 3], { start: 1, end: 50, count: 5 });
base.copy({ values: 15 }).values; // rank-derived bounded values
```

#### Overrides

[`Combination`](Combination.md).[`copy`](Combination.md#copy)

***

### equals()

> **equals**(`combination`): `boolean`

Defined in: [combinations/combination.ts:257](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L257)

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

#### Inherited from

[`Combination`](Combination.md).[`equals`](Combination.md#equals)

***

### generate()

> **generate**(`n?`): `BoundCombination`[]

Defined in: [combinations/combination.ts:575](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L575)

Generate random combinations within current bounds.

#### Parameters

##### n?

[`BoundCombinationGenerateOptions`](../interfaces/BoundCombinationGenerateOptions.md) = `{}`

Number of combinations to generate.

#### Returns

`BoundCombination`[]

Generated combinations.

#### Example

```ts
const generated = new BoundCombination(null, { start: 1, end: 50, count: 5 }).generate({ n: 2 });
generated.length; // 2
```

***

### get()

> **get**(`index`): `number`

Defined in: [combinations/combination.ts:408](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L408)

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

#### Inherited from

[`Combination`](Combination.md).[`get`](Combination.md#get)

***

### getValues()

> **getValues**(`start?`): [`CombinationValues`](../../types/type-aliases/CombinationValues.md)

Defined in: [combinations/combination.ts:237](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L237)

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

#### Inherited from

[`Combination`](Combination.md).[`getValues`](Combination.md#getvalues)

***

### hashCode()

> **hashCode**(): `number`

Defined in: [combinations/combination.ts:424](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L424)

Get an integer hash representation.

#### Returns

`number`

Rank-based hash.

#### Example

```ts
new Combination([1, 2, 3]).hashCode(); // 0
```

#### Inherited from

[`Combination`](Combination.md).[`hashCode`](Combination.md#hashcode)

***

### includes()

> **includes**(`combination`): `boolean`

Defined in: [combinations/combination.ts:292](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L292)

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

#### Inherited from

[`Combination`](Combination.md).[`includes`](Combination.md#includes)

***

### intersection()

> **intersection**(`combination`): [`Combination`](Combination.md)

Defined in: [combinations/combination.ts:340](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L340)

Get the intersection with another combination.

#### Parameters

##### combination

Candidate value(s).

[`CombinationInputValues`](../type-aliases/CombinationInputValues.md) | `null` | `undefined`

#### Returns

[`Combination`](Combination.md)

A new `Combination` containing shared values.

#### Example

```ts
new Combination([1, 2, 3]).intersection([3, 4, 5]).values; // [3]
```

#### Inherited from

[`Combination`](Combination.md).[`intersection`](Combination.md#intersection)

***

### intersects()

> **intersects**(`combination`): `boolean`

Defined in: [combinations/combination.ts:318](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L318)

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

#### Inherited from

[`Combination`](Combination.md).[`intersects`](Combination.md#intersects)

***

### similarity()

> **similarity**(`combination`): `number`

Defined in: [combinations/combination.ts:388](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L388)

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

#### Inherited from

[`Combination`](Combination.md).[`similarity`](Combination.md#similarity)

***

### toRepr()

> **toRepr**(): `string`

Defined in: [combinations/combination.ts:656](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L656)

Render string representation.

#### Returns

`string`

Representation string.

#### Example

```ts
new BoundCombination([1, 2, 3], null, 1, 50, 5).toRepr();
```

#### Overrides

[`Combination`](Combination.md).[`toRepr`](Combination.md#torepr)

***

### toString()

> **toString**(): `string`

Defined in: [combinations/combination.ts:637](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/combination.ts#L637)

Render values with fixed-width formatting.

#### Returns

`string`

Human-readable combination string.

#### Example

```ts
new BoundCombination([1, 2, 3], null, 1, 50, 5).toString();
```

#### Overrides

[`Combination`](Combination.md).[`toString`](Combination.md#tostring)
