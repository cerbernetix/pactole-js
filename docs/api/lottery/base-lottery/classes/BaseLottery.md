[**pactole-js**](../../../README.md)

***

# Class: BaseLottery

Defined in: [lottery/base-lottery.ts:53](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L53)

A base class for lottery implementations.

The class is essentially a thin wrapper around a draw-day schedule and a
combination factory. It provides convenience methods for computing draw dates
and delegating combination creation/generation.

## Param

Configuration options.

## Param

Draw schedule for the lottery. May be a `DrawDays` instance
  or any iterable of `DayInput` values (numbers, strings, `Date`, or `Weekday`).
  Defaults to an empty array.

## Param

Combination factory used by this lottery.
  Receives the same options object as [LotteryCombination.getCombination](../../../combinations/lottery-combination/classes/LotteryCombination.md#getcombination).
  If `null` or not callable, a default `LotteryCombination` factory is used.

## Example

```ts
const lottery = new BaseLottery({
  drawDays: [Weekday.MONDAY, Weekday.THURSDAY],
  combinationFactory: EuroMillionsCombination,
});

lottery.drawDays; // DrawDays instance
lottery.combinationFactory; // factory function
lottery.combinationFactory({ numbers: [1, 2, 3], stars: [1] });
```

## Extended by

- [`EuroDreams`](../../eurodreams/classes/EuroDreams.md)
- [`EuroMillions`](../../euromillions/classes/EuroMillions.md)

## Constructors

### Constructor

> **new BaseLottery**(`__namedParameters?`): `BaseLottery`

Defined in: [lottery/base-lottery.ts:57](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L57)

#### Parameters

##### \_\_namedParameters?

[`BaseLotteryOptions`](../interfaces/BaseLotteryOptions.md) = `{}`

#### Returns

`BaseLottery`

## Accessors

### combinationFactory

#### Get Signature

> **get** **combinationFactory**(): [`CombinationFactory`](../../../combinations/lottery-combination/type-aliases/CombinationFactory.md)

Defined in: [lottery/base-lottery.ts:94](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L94)

Return the combination factory associated with this lottery.

##### Example

```ts
const lottery = new BaseLottery({ combinationFactory: EuroMillionsCombination });
const factory = lottery.combinationFactory; // EuroMillionsCombination factory function
const combination = factory({ numbers: [1, 2, 3], stars: [1] }); // EuroMillionsCombination instance
```

##### Returns

[`CombinationFactory`](../../../combinations/lottery-combination/type-aliases/CombinationFactory.md)

The factory function used to create combinations.

***

### drawDays

#### Get Signature

> **get** **drawDays**(): [`DrawDays`](../../../utils/days/classes/DrawDays.md)

Defined in: [lottery/base-lottery.ts:78](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L78)

Return the [DrawDays](../../../utils/days/classes/DrawDays.md) instance associated with this lottery.

##### Example

```ts
const lottery = new BaseLottery({ drawDays: [Weekday.MONDAY, Weekday.THURSDAY] });
lottery.drawDays; // DrawDays instance with Monday and Thursday
```

##### Returns

[`DrawDays`](../../../utils/days/classes/DrawDays.md)

The [DrawDays](../../../utils/days/classes/DrawDays.md) instance configured for this lottery.

## Methods

### generate()

> **generate**(`options?`): [`LotteryCombination`](../../../combinations/lottery-combination/classes/LotteryCombination.md)[]

Defined in: [lottery/base-lottery.ts:154](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L154)

Generate a list of random lottery combinations from the configured
combination factory.

#### Parameters

##### options?

Options controlling generation.

###### n?

`number` = `1`

Number of combinations to generate (default `1`).

###### partitions?

`number` = `1`

Number of partitions to use when ranking/generating.
  (default `1`).

#### Returns

[`LotteryCombination`](../../../combinations/lottery-combination/classes/LotteryCombination.md)[]

An array of lottery combinations produced by the factory.

#### Example

```ts
const lottery = new BaseLottery({ combinationFactory: EuroMillionsCombination });
const combinations = lottery.generate({ n: 2 });
```

***

### getCombination()

> **getCombination**(`components`): [`LotteryCombination`](../../../combinations/lottery-combination/classes/LotteryCombination.md)

Defined in: [lottery/base-lottery.ts:171](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L171)

Create a lottery combination from the provided components using the
configured factory.

#### Parameters

##### components

`Record`\<`string`, [`CombinationInputOrRank`](../../../combinations/combination/type-aliases/CombinationInputOrRank.md)\>

Component values or ranks forwarded to the factory.

#### Returns

[`LotteryCombination`](../../../combinations/lottery-combination/classes/LotteryCombination.md)

A lottery combination produced by the factory.

#### Example

```ts
const lottery = new BaseLottery({ combinationFactory: EuroMillionsCombination });
const ticket = lottery.getCombination({ numbers: [1, 2, 3, 4, 5], stars: [1, 2] });
```

***

### getLastDrawDate()

> **getLastDrawDate**(`fromDate?`, `closest?`): `Date`

Defined in: [lottery/base-lottery.ts:114](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L114)

Return the date of the last lottery draw according to the configured
[drawDays](#drawdays).

#### Parameters

##### fromDate?

Starting reference date. Accepted formats:
  - A Unix timestamp in **seconds**.
  - An ISO date string (`YYYY-MM-DD`).
  - A `Date` object.
  - A `Weekday` or other `DayInput` accepted by DrawDays.getLastDrawDate.
  If omitted or `null`, the current date is used.

[`DayInput`](../../../utils/days/type-aliases/DayInput.md) | [`Weekday`](../../../utils/days/classes/Weekday.md) | `null`

##### closest?

`boolean` = `true`

Whether to return the closest draw date if `fromDate` is
  itself a draw day.

#### Returns

`Date`

A `Date` representing the last draw day on or before `fromDate`.

#### Throws

When `fromDate` is not a valid date input.

#### Throws

When `fromDate` string cannot be parsed.

***

### getNextDrawDate()

> **getNextDrawDate**(`fromDate?`, `closest?`): `Date`

Defined in: [lottery/base-lottery.ts:134](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L134)

Return the date of the next lottery draw according to the configured
[drawDays](#drawdays).

#### Parameters

##### fromDate?

Starting reference date. Accepted formats:
  - A Unix timestamp in **seconds**.
  - An ISO date string (`YYYY-MM-DD`).
  - A `Date` object.
  - A `Weekday` or other `DayInput` accepted by DrawDays.getNextDrawDate.
  If omitted or `null`, the current date is used.

[`DayInput`](../../../utils/days/type-aliases/DayInput.md) | [`Weekday`](../../../utils/days/classes/Weekday.md) | `null`

##### closest?

`boolean` = `true`

Whether to return the closest draw date if `fromDate` is
  itself a draw day.

#### Returns

`Date`

A `Date` representing the next draw day on or after `fromDate`.

#### Throws

When `fromDate` is not a valid date input.

#### Throws

When `fromDate` string cannot be parsed.
