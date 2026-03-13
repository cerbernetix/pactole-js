[**pactole-js**](../../../README.md)

***

# Class: EuroMillions

Defined in: [lottery/euromillions.ts:26](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/euromillions.ts#L26)

Class representing the EuroMillions lottery.

EuroMillions is a lottery game where players choose 5 main numbers from 1 to
50 and 2 star numbers from 1 to 12. The total number of combinations is
2,118,760 for the main numbers and 66 for the star numbers. In total, there
are 139,838,160 possible combinations.

Draws take place every Tuesday and Friday.

## Example

```ts
const lottery = new EuroMillions();
lottery.drawDays; // DrawDays instance
lottery.combinationFactory; // EuroMillionsCombination factory
lottery.getCombination({ numbers: [1,2,3,4,5], stars: [1,2] });
```

## Extends

- [`BaseLottery`](../../base-lottery/classes/BaseLottery.md)

## Constructors

### Constructor

> **new EuroMillions**(): `EuroMillions`

Defined in: [lottery/euromillions.ts:27](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/euromillions.ts#L27)

#### Returns

`EuroMillions`

#### Overrides

[`BaseLottery`](../../base-lottery/classes/BaseLottery.md).[`constructor`](../../base-lottery/classes/BaseLottery.md#constructor)

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

#### Inherited from

[`BaseLottery`](../../base-lottery/classes/BaseLottery.md).[`combinationFactory`](../../base-lottery/classes/BaseLottery.md#combinationfactory)

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

#### Inherited from

[`BaseLottery`](../../base-lottery/classes/BaseLottery.md).[`drawDays`](../../base-lottery/classes/BaseLottery.md#drawdays)

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

#### Inherited from

[`BaseLottery`](../../base-lottery/classes/BaseLottery.md).[`generate`](../../base-lottery/classes/BaseLottery.md#generate)

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

#### Inherited from

[`BaseLottery`](../../base-lottery/classes/BaseLottery.md).[`getCombination`](../../base-lottery/classes/BaseLottery.md#getcombination)

***

### getLastDrawDate()

> **getLastDrawDate**(`fromDate?`, `closest?`): `Date`

Defined in: [lottery/base-lottery.ts:114](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L114)

Return the date of the last lottery draw according to the configured
[drawDays](../../base-lottery/classes/BaseLottery.md#drawdays).

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

#### Inherited from

[`BaseLottery`](../../base-lottery/classes/BaseLottery.md).[`getLastDrawDate`](../../base-lottery/classes/BaseLottery.md#getlastdrawdate)

***

### getNextDrawDate()

> **getNextDrawDate**(`fromDate?`, `closest?`): `Date`

Defined in: [lottery/base-lottery.ts:134](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L134)

Return the date of the next lottery draw according to the configured
[drawDays](../../base-lottery/classes/BaseLottery.md#drawdays).

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

#### Inherited from

[`BaseLottery`](../../base-lottery/classes/BaseLottery.md).[`getNextDrawDate`](../../base-lottery/classes/BaseLottery.md#getnextdrawdate)
