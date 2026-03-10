[**pactole-js**](../../../README.md)

***

# Class: LotteryCombination

Defined in: [combinations/lottery-combination.ts:86](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L86)

Class representing a Lottery combination.

A Lottery combination is a compound combination that can consist of multiple
components (for example main numbers and bonus numbers).

## Param

The combination to copy from.

## Param

The winning-rank mapping.

## Param

The component combinations.

## Throws

Thrown when a component is not a `BoundCombination` instance.

## Example

```ts
const numbers = new BoundCombination({ values: [1, 2, 3, 4, 5], start: 1, end: 50, count: 5 });
const stars = new BoundCombination({ values: [1, 2], start: 1, end: 12, count: 2 });
const combination = new LotteryCombination({ components: { numbers, stars } });
combination.values; // [1, 2, 3, 4, 5, 1, 2]
```

## Extended by

- [`EuroDreamsCombination`](../../eurodreams-combination/classes/EuroDreamsCombination.md)
- [`EuroMillionsCombination`](../../euromillions-combination/classes/EuroMillionsCombination.md)

## Constructors

### Constructor

> **new LotteryCombination**(`__namedParameters?`): `LotteryCombination`

Defined in: [combinations/lottery-combination.ts:91](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L91)

#### Parameters

##### \_\_namedParameters?

[`LotteryCombinationOptions`](../interfaces/LotteryCombinationOptions.md) = `{}`

#### Returns

`LotteryCombination`

## Accessors

### combinations

#### Get Signature

> **get** **combinations**(): `number`

Defined in: [combinations/lottery-combination.ts:217](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L217)

Get total number of possible combinations.

##### Example

```ts
new LotteryCombination().combinations; // 0
```

##### Returns

`number`

Product of component combinations or `0` for empty lottery.

***

### components

#### Get Signature

> **get** **components**(): [`CombinationComponents`](../type-aliases/CombinationComponents.md)

Defined in: [combinations/lottery-combination.ts:135](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L135)

Get a copy of component mapping.

##### Example

```ts
const lottery = new LotteryCombination({ components: { numbers: new BoundCombination([1, 2, 3], { start: 1, end: 50, count: 5 }) } });
Object.keys(lottery.components); // ['numbers']
```

##### Returns

[`CombinationComponents`](../type-aliases/CombinationComponents.md)

Shallow copy of component map.

***

### count

#### Get Signature

> **get** **count**(): `number`

Defined in: [combinations/lottery-combination.ts:205](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L205)

Get configured component total count.

##### Example

```ts
const numbers = new BoundCombination(null, null, 1, 50, 5);
const stars = new BoundCombination(null, null, 1, 12, 2);
new LotteryCombination({ components: { numbers, stars } }).count; // 7
```

##### Returns

`number`

Sum of configured component counts.

***

### length

#### Get Signature

> **get** **length**(): `number`

Defined in: [combinations/lottery-combination.ts:191](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L191)

Get flattened value length.

##### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
const stars = new BoundCombination([1, 2], null, 1, 12, 2);
new LotteryCombination({ components: { numbers, stars } }).length; // 7
```

##### Returns

`number`

Number of selected values across components.

***

### maxWinningRank

#### Get Signature

> **get** **maxWinningRank**(): `number` \| `null`

Defined in: [combinations/lottery-combination.ts:281](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L281)

Get maximum winning rank.

##### Example

```ts
new LotteryCombination({ winningRanks: { '5,2': 1, '4,2': 4 } }).maxWinningRank; // 4
```

##### Returns

`number` \| `null`

Maximum winning rank or `null`.

***

### minWinningRank

#### Get Signature

> **get** **minWinningRank**(): `number` \| `null`

Defined in: [combinations/lottery-combination.ts:264](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L264)

Get minimum winning rank.

##### Example

```ts
new LotteryCombination({ winningRanks: { '5,2': 1, '4,2': 4 } }).minWinningRank; // 1
```

##### Returns

`number` \| `null`

Minimum winning rank or `null`.

***

### nbWinningRanks

#### Get Signature

> **get** **nbWinningRanks**(): `number`

Defined in: [combinations/lottery-combination.ts:247](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L247)

Get winning-rank span length.

##### Example

```ts
new LotteryCombination({ winningRanks: { '5,2': 1, '4,2': 4 } }).nbWinningRanks; // 4
```

##### Returns

`number`

Span length between min and max rank values (inclusive).

***

### rank

#### Get Signature

> **get** **rank**(): `number`

Defined in: [combinations/lottery-combination.ts:163](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L163)

Get mixed rank of all components.

##### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
const stars = new BoundCombination([1, 2], null, 1, 12, 2);
new LotteryCombination({ components: { numbers, stars } }).rank;
```

##### Returns

`number`

Combined rank.

***

### values

#### Get Signature

> **get** **values**(): [`CombinationValues`](../../types/type-aliases/CombinationValues.md)

Defined in: [combinations/lottery-combination.ts:149](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L149)

Get flattened values of all components in declaration order.

##### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
const stars = new BoundCombination([1, 2], null, 1, 12, 2);
new LotteryCombination({ components: { numbers, stars } }).values; // [1, 2, 3, 4, 5, 1, 2]
```

##### Returns

[`CombinationValues`](../../types/type-aliases/CombinationValues.md)

Flattened values.

***

### winningRanks

#### Get Signature

> **get** **winningRanks**(): [`CombinationWinningRanks`](../type-aliases/CombinationWinningRanks.md)

Defined in: [combinations/lottery-combination.ts:235](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L235)

Get a copy of winning-rank mapping.

##### Example

```ts
const lottery = new LotteryCombination({ winningRanks: { '5,2': 1 } });
lottery.winningRanks; // { '5,2': 1 }
```

##### Returns

[`CombinationWinningRanks`](../type-aliases/CombinationWinningRanks.md)

Winning-rank map copy.

## Methods

### \[iterator\]()

> **\[iterator\]**(): `Iterator`\<`number`\>

Defined in: [combinations/lottery-combination.ts:792](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L792)

#### Returns

`Iterator`\<`number`\>

***

### buildComponents()

> `protected` **buildComponents**(`components`): [`CombinationComponents`](../type-aliases/CombinationComponents.md)

Defined in: [combinations/lottery-combination.ts:802](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L802)

Build a mapped `CombinationComponents` object from a components payload.

Subclasses may override this to customize how provided component inputs
are turned into `BoundCombination` instances.

#### Parameters

##### components

`Record`\<`string`, [`CombinationInputOrRank`](../../combination/type-aliases/CombinationInputOrRank.md) \| `LotteryCombination`\>

#### Returns

[`CombinationComponents`](../type-aliases/CombinationComponents.md)

***

### compares()

> **compares**(`combination?`): `number`

Defined in: [combinations/lottery-combination.ts:642](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L642)

Compare with another input.

#### Parameters

##### combination?

[`LotteryCombinationMatchOptions`](../interfaces/LotteryCombinationMatchOptions.md) = `{}`

Optional rank/values/combination source.

#### Returns

`number`

`-1`, `0`, or `1`.

#### Throws

Thrown when an unknown component name is provided.

#### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
const lottery = new LotteryCombination({ components: { numbers } });
lottery.compares({ combination: [1, 2, 3, 4, 6] }); // -1
```

***

### copy()

> **copy**(`winningRanks?`): `this`

Defined in: [combinations/lottery-combination.ts:353](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L353)

Copy this combination with optional overrides.

#### Parameters

##### winningRanks?

[`LotteryCombinationCopyOptions`](../interfaces/LotteryCombinationCopyOptions.md) = `{}`

Optional replacement winning-rank map.

#### Returns

`this`

New lottery combination.

#### Example

```ts
const numbers = new BoundCombination({ values: [1, 2, 3, 4, 5], start: 1, end: 50, count: 5 });
const base = new LotteryCombination({ winningRanks: { '5': 1 }, components: { numbers } });
base.copy({ winningRanks: { '4': 2 } }).winningRanks; // { '4': 2 }
```

***

### createCombination()

> `protected` **createCombination**(`components`, `winningRanks`): `this`

Defined in: [combinations/lottery-combination.ts:833](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L833)

Create a new `LotteryCombination` instance. Made `protected` so subclasses
can override instance creation behavior while reusing `buildComponents`.

#### Parameters

##### components

`Record`\<`string`, [`CombinationInputOrRank`](../../combination/type-aliases/CombinationInputOrRank.md) \| `LotteryCombination`\>

##### winningRanks

[`CombinationWinningRanks`](../type-aliases/CombinationWinningRanks.md) | `null`

#### Returns

`this`

***

### equals()

> **equals**(`combination?`): `boolean`

Defined in: [combinations/lottery-combination.ts:515](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L515)

Test equality with another input.

#### Parameters

##### combination?

[`LotteryCombinationMatchOptions`](../interfaces/LotteryCombinationMatchOptions.md) = `{}`

Optional rank/values/combination source.

#### Returns

`boolean`

`true` when fully equal.

#### Throws

Thrown when an unknown component name is provided.

#### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
const a = new LotteryCombination({ components: { numbers } });
const b = a.copy();
a.equals(b); // true
```

***

### generate()

> **generate**(`n?`): `LotteryCombination`[]

Defined in: [combinations/lottery-combination.ts:334](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L334)

Generate random combinations with the same component schema.

#### Parameters

##### n?

[`LotteryCombinationGenerateOptions`](../interfaces/LotteryCombinationGenerateOptions.md) = `{}`

Number of combinations to generate.

#### Returns

`LotteryCombination`[]

Generated combinations.

#### Example

```ts
const numbers = new BoundCombination(null, { start: 1, end: 50, count: 5 });
const stars = new BoundCombination(null, { start: 1, end: 12, count: 2 });
new LotteryCombination({ components: { numbers, stars } }).generate({ n: 2 }).length; // 2
```

***

### get()

> **get**(`index`): `number`

Defined in: [combinations/lottery-combination.ts:733](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L733)

Get a value by flattened index.

#### Parameters

##### index

`number`

Zero-based flattened index.

#### Returns

`number`

Flattened value at `index`.

#### Throws

Thrown when index is out of bounds.

***

### getCombination()

> **getCombination**(`combination?`): `this`

Defined in: [combinations/lottery-combination.ts:379](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L379)

Build a combination from rank, values, or another lottery combination.

#### Parameters

##### combination?

[`LotteryCombinationBuildOptions`](../interfaces/LotteryCombinationBuildOptions.md) = `{}`

Optional rank/values/combination source.

#### Returns

`this`

Constructed lottery combination.

#### Throws

Thrown when an unknown component name is provided.

#### Example

```ts
const numbers = new BoundCombination({ start: 1, end: 50, count: 5 });
const stars = new BoundCombination({ start: 1, end: 12, count: 2 });
const lottery = new LotteryCombination({ components: { numbers, stars } });
lottery.getCombination({ combination: [1, 2, 3, 4, 5, 1, 2] }).values; // [1, 2, 3, 4, 5, 1, 2]
```

***

### getComponent()

> **getComponent**(`name`): [`BoundCombination`](../../combination/classes/BoundCombination.md) \| `null`

Defined in: [combinations/lottery-combination.ts:462](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L462)

Get a component by name.

#### Parameters

##### name

`string`

Component name.

#### Returns

[`BoundCombination`](../../combination/classes/BoundCombination.md) \| `null`

Component or `null`.

#### Example

```ts
const lottery = new LotteryCombination({ components: { numbers: new BoundCombination(null, { start: 1, end: 50, count: 5 }) } });
lottery.getComponent('numbers'); // BoundCombination
lottery.getComponent('stars'); // null
```

***

### getComponents()

> **getComponents**(`components?`): [`CombinationComponents`](../type-aliases/CombinationComponents.md)

Defined in: [combinations/lottery-combination.ts:436](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L436)

Build updated components for known component names.

#### Parameters

##### components?

`Record`\<`string`, [`CombinationInputOrRank`](../../combination/type-aliases/CombinationInputOrRank.md) \| `LotteryCombination`\> = `{}`

Component update payload.

#### Returns

[`CombinationComponents`](../type-aliases/CombinationComponents.md)

Built component map.

#### Throws

Thrown when an unknown component name is provided.

#### Example

```ts
const numbers = new BoundCombination(null, { start: 1, end: 50, count: 5 });
const lottery = new LotteryCombination({ components: { numbers } });
lottery.getComponents({ numbers: [1, 2, 3, 4, 5] }).numbers.values;
```

***

### getComponentValues()

> **getComponentValues**(`name`): [`CombinationValues`](../../types/type-aliases/CombinationValues.md)

Defined in: [combinations/lottery-combination.ts:476](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L476)

Get values for a specific component.

#### Parameters

##### name

`string`

Component name.

#### Returns

[`CombinationValues`](../../types/type-aliases/CombinationValues.md)

Component values or empty array.

#### Example

```ts
const lottery = new LotteryCombination({ components: { numbers: new BoundCombination([1, 2, 3, 4, 5], { start: 1, end: 50, count: 5 }) } });
lottery.getComponentValues('numbers'); // [1, 2, 3, 4, 5]
```

***

### getWinningRank()

> **getWinningRank**(`combination?`): `number` \| `null`

Defined in: [combinations/lottery-combination.ts:495](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L495)

Get winning rank against a candidate winning combination.

#### Parameters

##### combination?

[`LotteryCombinationMatchOptions`](../interfaces/LotteryCombinationMatchOptions.md) = `{}`

Optional rank/values/combination source.

#### Returns

`number` \| `null`

Winning rank or `null` when unmatched.

#### Throws

Thrown when an unknown component name is provided.

#### Example

```ts
const ranks = createWinningRanks([[[5, 2], 1]]);
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
const stars = new BoundCombination([1, 2], null, 1, 12, 2);
const lottery = new LotteryCombination({ winningRanks: ranks, components: { numbers, stars } });
lottery.getWinningRank({ combination: [1, 2, 3, 4, 5, 1, 2] }); // 1
```

***

### has()

> **has**(`value`): `boolean`

Defined in: [combinations/lottery-combination.ts:752](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L752)

Check scalar containment in flattened values.

#### Parameters

##### value

`number`

Candidate value.

#### Returns

`boolean`

`true` when value is present.

#### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
new LotteryCombination({ components: { numbers } }).has(3); // true
```

***

### hashCode()

> **hashCode**(): `number`

Defined in: [combinations/lottery-combination.ts:765](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L765)

Get integer hash representation.

#### Returns

`number`

Rank-based hash.

#### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
new LotteryCombination({ components: { numbers } }).hashCode();
```

***

### includes()

> **includes**(`combination?`): `boolean`

Defined in: [combinations/lottery-combination.ts:552](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L552)

Test inclusion of another input.

#### Parameters

##### combination?

[`LotteryCombinationIncludesOptions`](../interfaces/LotteryCombinationIncludesOptions.md) = `{}`

Optional scalar/rank/values/combination source.

#### Returns

`boolean`

`true` when the candidate is included.

#### Throws

Thrown when an unknown component name is provided.

#### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
const lottery = new LotteryCombination({ components: { numbers } });
lottery.includes({ combination: 3 }); // true
```

***

### intersection()

> **intersection**(`combination?`): `LotteryCombination`

Defined in: [combinations/lottery-combination.ts:609](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L609)

Get intersection with another input.

#### Parameters

##### combination?

[`LotteryCombinationMatchOptions`](../interfaces/LotteryCombinationMatchOptions.md) = `{}`

Optional rank/values/combination source.

#### Returns

`LotteryCombination`

Intersection lottery combination.

#### Throws

Thrown when an unknown component name is provided.

#### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
const lottery = new LotteryCombination({ components: { numbers } });
lottery.intersection({ combination: [4, 5] }).values; // [4, 5]
```

***

### intersects()

> **intersects**(`combination?`): `boolean`

Defined in: [combinations/lottery-combination.ts:584](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L584)

Test intersection with another input.

#### Parameters

##### combination?

[`LotteryCombinationMatchOptions`](../interfaces/LotteryCombinationMatchOptions.md) = `{}`

Optional rank/values/combination source.

#### Returns

`boolean`

`true` when every provided non-empty component intersects.

#### Throws

Thrown when an unknown component name is provided.

#### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
const lottery = new LotteryCombination({ components: { numbers } });
lottery.intersects({ combination: [5] }); // true
```

***

### similarity()

> **similarity**(`combination?`): `number`

Defined in: [combinations/lottery-combination.ts:681](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L681)

Compute similarity ratio in `[0, 1]`.

#### Parameters

##### combination?

[`LotteryCombinationMatchOptions`](../interfaces/LotteryCombinationMatchOptions.md) = `{}`

Optional rank/values/combination source.

#### Returns

`number`

Similarity ratio.

#### Throws

Thrown when an unknown component name is provided.

#### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
const lottery = new LotteryCombination({ components: { numbers } });
lottery.similarity({ combination: [1, 2, 8, 9, 10] }); // 0.4
```

***

### toRepr()

> **toRepr**(): `string`

Defined in: [combinations/lottery-combination.ts:778](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L778)

Return a string representation.

#### Returns

`string`

Representation string.

#### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
new LotteryCombination({ components: { numbers } }).toRepr();
```

***

### toString()

> **toString**(): `string`

Defined in: [combinations/lottery-combination.ts:786](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L786)

#### Returns

`string`

***

### getCombinationFactory()

> `static` **getCombinationFactory**(`combinationFactory`): (`options?`) => `LotteryCombination`

Defined in: [combinations/lottery-combination.ts:303](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L303)

Normalize a factory input.

Accepts a direct factory function, a template `LotteryCombination`, or
any fallback value (resolved to an empty-default factory).

#### Parameters

##### combinationFactory

`unknown`

Factory-like input.

#### Returns

Normalized factory function.

> (`options?`): `LotteryCombination`

##### Parameters

###### options?

###### combination?

[`CombinationInput`](../../combination/type-aliases/CombinationInput.md) \| `LotteryCombination`

###### components?

`Record`\<`string`, [`CombinationInputOrRank`](../../combination/type-aliases/CombinationInputOrRank.md) \| `LotteryCombination`\>

##### Returns

`LotteryCombination`

#### Example

```ts
const factory = LotteryCombination.getCombinationFactory(null);
factory(undefined, { components: {} }); // LotteryCombination
```
