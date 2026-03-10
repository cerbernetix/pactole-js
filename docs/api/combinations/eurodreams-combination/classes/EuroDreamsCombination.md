[**pactole-js**](../../../README.md)

***

# Class: EuroDreamsCombination

Defined in: [combinations/eurodreams-combination.ts:66](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/eurodreams-combination.ts#L66)

Preconfigured EuroDreams lottery combination.

The constructor accepts an options object with optional `numbers` and
`dream` fields.  It also supports passing a flattened array where the dream
value immediately follows the main numbers; when `dream` is omitted the
first 6 elements are treated as main values and the following 1 as the dream
number.

## Param

main numbers, a rank, another
  EuroDreamsCombination (copy semantics), or an iterable that may
  include the dream value when `dream` is omitted.

## Param

dream number or rank; if `null` and
  `numbers` is an iterable the trailing element is treated as the dream.

## Example

```ts
const comb = new EuroDreamsCombination({ numbers: [3, 5, 12, 23, 44, 6], dream: [2] });
comb.numbers.toString();
comb.dream.toString();
```

## Extends

- [`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md)

## Constructors

### Constructor

> **new EuroDreamsCombination**(`__namedParameters?`): `EuroDreamsCombination`

Defined in: [combinations/eurodreams-combination.ts:70](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/eurodreams-combination.ts#L70)

#### Parameters

##### \_\_namedParameters?

[`EuroDreamsCombinationOptions`](../interfaces/EuroDreamsCombinationOptions.md) = `{}`

#### Returns

`EuroDreamsCombination`

#### Overrides

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`constructor`](../../lottery-combination/classes/LotteryCombination.md#constructor)

## Properties

### dream

> `readonly` **dream**: [`BoundCombination`](../../combination/classes/BoundCombination.md)

Defined in: [combinations/eurodreams-combination.ts:68](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/eurodreams-combination.ts#L68)

***

### numbers

> `readonly` **numbers**: [`BoundCombination`](../../combination/classes/BoundCombination.md)

Defined in: [combinations/eurodreams-combination.ts:67](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/eurodreams-combination.ts#L67)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`combinations`](../../lottery-combination/classes/LotteryCombination.md#combinations)

***

### components

#### Get Signature

> **get** **components**(): [`CombinationComponents`](../../lottery-combination/type-aliases/CombinationComponents.md)

Defined in: [combinations/lottery-combination.ts:135](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L135)

Get a copy of component mapping.

##### Example

```ts
const lottery = new LotteryCombination({ components: { numbers: new BoundCombination([1, 2, 3], { start: 1, end: 50, count: 5 }) } });
Object.keys(lottery.components); // ['numbers']
```

##### Returns

[`CombinationComponents`](../../lottery-combination/type-aliases/CombinationComponents.md)

Shallow copy of component map.

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`components`](../../lottery-combination/classes/LotteryCombination.md#components)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`count`](../../lottery-combination/classes/LotteryCombination.md#count)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`length`](../../lottery-combination/classes/LotteryCombination.md#length)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`maxWinningRank`](../../lottery-combination/classes/LotteryCombination.md#maxwinningrank)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`minWinningRank`](../../lottery-combination/classes/LotteryCombination.md#minwinningrank)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`nbWinningRanks`](../../lottery-combination/classes/LotteryCombination.md#nbwinningranks)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`rank`](../../lottery-combination/classes/LotteryCombination.md#rank)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`values`](../../lottery-combination/classes/LotteryCombination.md#values)

***

### winningRanks

#### Get Signature

> **get** **winningRanks**(): [`CombinationWinningRanks`](../../lottery-combination/type-aliases/CombinationWinningRanks.md)

Defined in: [combinations/lottery-combination.ts:235](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L235)

Get a copy of winning-rank mapping.

##### Example

```ts
const lottery = new LotteryCombination({ winningRanks: { '5,2': 1 } });
lottery.winningRanks; // { '5,2': 1 }
```

##### Returns

[`CombinationWinningRanks`](../../lottery-combination/type-aliases/CombinationWinningRanks.md)

Winning-rank map copy.

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`winningRanks`](../../lottery-combination/classes/LotteryCombination.md#winningranks)

## Methods

### \[iterator\]()

> **\[iterator\]**(): `Iterator`\<`number`\>

Defined in: [combinations/lottery-combination.ts:792](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L792)

#### Returns

`Iterator`\<`number`\>

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`[iterator]`](../../lottery-combination/classes/LotteryCombination.md#iterator)

***

### buildComponents()

> `protected` **buildComponents**(`components`): [`CombinationComponents`](../../lottery-combination/type-aliases/CombinationComponents.md)

Defined in: [combinations/lottery-combination.ts:802](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L802)

Build a mapped `CombinationComponents` object from a components payload.

Subclasses may override this to customize how provided component inputs
are turned into `BoundCombination` instances.

#### Parameters

##### components

`Record`\<`string`, [`CombinationInputOrRank`](../../combination/type-aliases/CombinationInputOrRank.md) \| [`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md)\>

#### Returns

[`CombinationComponents`](../../lottery-combination/type-aliases/CombinationComponents.md)

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`buildComponents`](../../lottery-combination/classes/LotteryCombination.md#buildcomponents)

***

### compares()

> **compares**(`combination?`): `number`

Defined in: [combinations/lottery-combination.ts:642](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L642)

Compare with another input.

#### Parameters

##### combination?

[`LotteryCombinationMatchOptions`](../../lottery-combination/interfaces/LotteryCombinationMatchOptions.md) = `{}`

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`compares`](../../lottery-combination/classes/LotteryCombination.md#compares)

***

### copy()

> **copy**(`winningRanks?`): `this`

Defined in: [combinations/lottery-combination.ts:353](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L353)

Copy this combination with optional overrides.

#### Parameters

##### winningRanks?

[`LotteryCombinationCopyOptions`](../../lottery-combination/interfaces/LotteryCombinationCopyOptions.md) = `{}`

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`copy`](../../lottery-combination/classes/LotteryCombination.md#copy)

***

### createCombination()

> `protected` **createCombination**(`components`, `_winningRanks`): `this`

Defined in: [combinations/eurodreams-combination.ts:106](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/eurodreams-combination.ts#L106)

Create a new `LotteryCombination` instance. Made `protected` so subclasses
can override instance creation behavior while reusing `buildComponents`.

#### Parameters

##### components

`Record`\<`string`, [`CombinationInputOrRank`](../../combination/type-aliases/CombinationInputOrRank.md) \| [`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md)\>

##### \_winningRanks

[`CombinationWinningRanks`](../../lottery-combination/type-aliases/CombinationWinningRanks.md) | `null`

#### Returns

`this`

#### Overrides

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`createCombination`](../../lottery-combination/classes/LotteryCombination.md#createcombination)

***

### equals()

> **equals**(`combination?`): `boolean`

Defined in: [combinations/lottery-combination.ts:515](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L515)

Test equality with another input.

#### Parameters

##### combination?

[`LotteryCombinationMatchOptions`](../../lottery-combination/interfaces/LotteryCombinationMatchOptions.md) = `{}`

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`equals`](../../lottery-combination/classes/LotteryCombination.md#equals)

***

### generate()

> **generate**(`n?`): `EuroDreamsCombination`[]

Defined in: [combinations/lottery-combination.ts:334](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L334)

Generate random combinations with the same component schema.

#### Parameters

##### n?

[`LotteryCombinationGenerateOptions`](../../lottery-combination/interfaces/LotteryCombinationGenerateOptions.md) = `{}`

Number of combinations to generate.

#### Returns

`EuroDreamsCombination`[]

Generated combinations.

#### Example

```ts
const numbers = new BoundCombination(null, { start: 1, end: 50, count: 5 });
const stars = new BoundCombination(null, { start: 1, end: 12, count: 2 });
new LotteryCombination({ components: { numbers, stars } }).generate({ n: 2 }).length; // 2
```

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`generate`](../../lottery-combination/classes/LotteryCombination.md#generate)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`get`](../../lottery-combination/classes/LotteryCombination.md#get)

***

### getCombination()

> **getCombination**(`combination?`): `this`

Defined in: [combinations/lottery-combination.ts:379](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L379)

Build a combination from rank, values, or another lottery combination.

#### Parameters

##### combination?

[`LotteryCombinationBuildOptions`](../../lottery-combination/interfaces/LotteryCombinationBuildOptions.md) = `{}`

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`getCombination`](../../lottery-combination/classes/LotteryCombination.md#getcombination)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`getComponent`](../../lottery-combination/classes/LotteryCombination.md#getcomponent)

***

### getComponents()

> **getComponents**(`components?`): [`CombinationComponents`](../../lottery-combination/type-aliases/CombinationComponents.md)

Defined in: [combinations/lottery-combination.ts:436](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L436)

Build updated components for known component names.

#### Parameters

##### components?

`Record`\<`string`, [`CombinationInputOrRank`](../../combination/type-aliases/CombinationInputOrRank.md) \| [`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md)\> = `{}`

Component update payload.

#### Returns

[`CombinationComponents`](../../lottery-combination/type-aliases/CombinationComponents.md)

Built component map.

#### Throws

Thrown when an unknown component name is provided.

#### Example

```ts
const numbers = new BoundCombination(null, { start: 1, end: 50, count: 5 });
const lottery = new LotteryCombination({ components: { numbers } });
lottery.getComponents({ numbers: [1, 2, 3, 4, 5] }).numbers.values;
```

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`getComponents`](../../lottery-combination/classes/LotteryCombination.md#getcomponents)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`getComponentValues`](../../lottery-combination/classes/LotteryCombination.md#getcomponentvalues)

***

### getWinningRank()

> **getWinningRank**(`combination?`): `number` \| `null`

Defined in: [combinations/lottery-combination.ts:495](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L495)

Get winning rank against a candidate winning combination.

#### Parameters

##### combination?

[`LotteryCombinationMatchOptions`](../../lottery-combination/interfaces/LotteryCombinationMatchOptions.md) = `{}`

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`getWinningRank`](../../lottery-combination/classes/LotteryCombination.md#getwinningrank)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`has`](../../lottery-combination/classes/LotteryCombination.md#has)

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`hashCode`](../../lottery-combination/classes/LotteryCombination.md#hashcode)

***

### includes()

> **includes**(`combination?`): `boolean`

Defined in: [combinations/lottery-combination.ts:552](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L552)

Test inclusion of another input.

#### Parameters

##### combination?

[`LotteryCombinationIncludesOptions`](../../lottery-combination/interfaces/LotteryCombinationIncludesOptions.md) = `{}`

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`includes`](../../lottery-combination/classes/LotteryCombination.md#includes)

***

### intersection()

> **intersection**(`combination?`): [`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md)

Defined in: [combinations/lottery-combination.ts:609](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L609)

Get intersection with another input.

#### Parameters

##### combination?

[`LotteryCombinationMatchOptions`](../../lottery-combination/interfaces/LotteryCombinationMatchOptions.md) = `{}`

Optional rank/values/combination source.

#### Returns

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md)

Intersection lottery combination.

#### Throws

Thrown when an unknown component name is provided.

#### Example

```ts
const numbers = new BoundCombination([1, 2, 3, 4, 5], null, 1, 50, 5);
const lottery = new LotteryCombination({ components: { numbers } });
lottery.intersection({ combination: [4, 5] }).values; // [4, 5]
```

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`intersection`](../../lottery-combination/classes/LotteryCombination.md#intersection)

***

### intersects()

> **intersects**(`combination?`): `boolean`

Defined in: [combinations/lottery-combination.ts:584](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L584)

Test intersection with another input.

#### Parameters

##### combination?

[`LotteryCombinationMatchOptions`](../../lottery-combination/interfaces/LotteryCombinationMatchOptions.md) = `{}`

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`intersects`](../../lottery-combination/classes/LotteryCombination.md#intersects)

***

### similarity()

> **similarity**(`combination?`): `number`

Defined in: [combinations/lottery-combination.ts:681](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L681)

Compute similarity ratio in `[0, 1]`.

#### Parameters

##### combination?

[`LotteryCombinationMatchOptions`](../../lottery-combination/interfaces/LotteryCombinationMatchOptions.md) = `{}`

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

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`similarity`](../../lottery-combination/classes/LotteryCombination.md#similarity)

***

### toRepr()

> **toRepr**(): `string`

Defined in: [combinations/eurodreams-combination.ts:121](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/eurodreams-combination.ts#L121)

Return a string representation.

#### Returns

`string`

Representation string.

#### Overrides

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`toRepr`](../../lottery-combination/classes/LotteryCombination.md#torepr)

***

### toString()

> **toString**(): `string`

Defined in: [combinations/lottery-combination.ts:786](https://github.com/cerbernetix/pactole-js/blob/28397dfe88db477d694f619975c7d4cd2ebe6d3f/src/combinations/lottery-combination.ts#L786)

#### Returns

`string`

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`toString`](../../lottery-combination/classes/LotteryCombination.md#tostring)

***

### getCombinationFactory()

> `static` **getCombinationFactory**(`combinationFactory`): (`options?`) => [`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md)

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

> (`options?`): [`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md)

##### Parameters

###### options?

###### combination?

[`CombinationInput`](../../combination/type-aliases/CombinationInput.md) \| [`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md)

###### components?

`Record`\<`string`, [`CombinationInputOrRank`](../../combination/type-aliases/CombinationInputOrRank.md) \| [`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md)\>

##### Returns

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md)

#### Example

```ts
const factory = LotteryCombination.getCombinationFactory(null);
factory(undefined, { components: {} }); // LotteryCombination
```

#### Inherited from

[`LotteryCombination`](../../lottery-combination/classes/LotteryCombination.md).[`getCombinationFactory`](../../lottery-combination/classes/LotteryCombination.md#getcombinationfactory)
