[**pactole-js**](../../../README.md)

***

# Interface: BaseLotteryOptions

Defined in: [lottery/base-lottery.ts:7](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L7)

Options for creating a [BaseLottery](../classes/BaseLottery.md).

## Properties

### combinationFactory?

> `optional` **combinationFactory**: [`CombinationFactory`](../../../combinations/lottery-combination/type-aliases/CombinationFactory.md) \| `null`

Defined in: [lottery/base-lottery.ts:23](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L23)

Combination factory used by this lottery. Receives the same options
object as [LotteryCombination.getCombination](../../../combinations/lottery-combination/classes/LotteryCombination.md#getcombination). If `null` or not
callable, a default `LotteryCombination` factory is used.

#### Default

```ts
null
```

***

### drawDays?

> `optional` **drawDays**: `Iterable`\<[`DayInput`](../../../utils/days/type-aliases/DayInput.md) \| [`Weekday`](../../../utils/days/classes/Weekday.md), `any`, `any`\> \| [`DrawDays`](../../../utils/days/classes/DrawDays.md)

Defined in: [lottery/base-lottery.ts:14](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/lottery/base-lottery.ts#L14)

Draw schedule for the lottery. May be a `DrawDays` instance or any iterable
of `DayInput` values (numbers, strings, `Date`, or `Weekday`).

#### Default

```ts
[]
```
