[**pactole-js**](../../../README.md)

***

# Class: DrawDays

Defined in: [utils/days.ts:526](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L526)

Helper for lotteries to compute last/next draw dates given a set of weekday
draw days.

The constructor accepts any iterable of weekday values; methods take the
same loose inputs as `Weekday` (including `Date`/timestamp) and return
`Date` objects.  However, supplying a `Weekday` instance as the
`from_date` parameter is not allowed and will raise a `TypeError`.

## Param

iterable of weekday inputs defining the draw schedule.

## Example

```ts
const draws = new DrawDays([Weekday.MONDAY, Weekday.THURSDAY]);
draws.get_last_draw_date(new Date(2024, 5, 5)); // 2024-06-03
draws.get_next_draw_date("2024-06-05");        // 2024-06-06
```

## Constructors

### Constructor

> **new DrawDays**(`days`): `DrawDays`

Defined in: [utils/days.ts:529](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L529)

#### Parameters

##### days

`Iterable`\<[`DayInput`](../type-aliases/DayInput.md) \| [`Weekday`](Weekday.md)\>

#### Returns

`DrawDays`

## Accessors

### days

#### Get Signature

> **get** **days**(): readonly [`Weekday`](Weekday.md)[]

Defined in: [utils/days.ts:536](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L536)

Read-only array of the configured draw weekdays.

##### Returns

readonly [`Weekday`](Weekday.md)[]

## Methods

### get\_last\_draw\_date()

> **get\_last\_draw\_date**(`from_date?`, `closest?`): `Date`

Defined in: [utils/days.ts:562](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L562)

Return the most recent draw date on or before `from_date`.

The input is coerced via [Weekday.get\_date](Weekday.md#get_date), so the same variety of
strings, timestamps and `Date` objects is accepted. Type/format errors
will propagate from that helper.

#### Parameters

##### from\_date?

reference moment; when omitted uses today.

[`DayInput`](../type-aliases/DayInput.md) | [`Weekday`](Weekday.md) | `null`

##### closest?

`boolean` = `true`

if `true` and `from_date` itself is a draw day, it is
                 returned; otherwise the previous draw day is used.

#### Returns

`Date`

a `Date` object occurring on one of the configured draw days.

#### Throws

TypeError/RangeError from [Weekday.get\_date](Weekday.md#get_date) on invalid
        `from_date` input.  Passing a `Weekday` instance is *not*
        considered a valid date and will therefore throw.

#### Example

```ts
const dd = new DrawDays([Weekday.MONDAY, Weekday.THURSDAY]);
dd.get_last_draw_date("2024-06-05"); // 2024-06-03
dd.get_last_draw_date(new Date(2024, 5, 6)); // same day if closest
```

***

### get\_next\_draw\_date()

> **get\_next\_draw\_date**(`from_date?`, `closest?`): `Date`

Defined in: [utils/days.ts:585](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L585)

Return the next draw date on or after `from_date`.

Parameters mirror [get\_last\_draw\_date](#get_last_draw_date).

#### Parameters

##### from\_date?

[`DayInput`](../type-aliases/DayInput.md) | [`Weekday`](Weekday.md) | `null`

##### closest?

`boolean` = `true`

#### Returns

`Date`

#### Throws

TypeError/RangeError from [Weekday.get\_date](Weekday.md#get_date) on invalid
        `from_date` input.  Passing a `Weekday` instance is *not*
        considered a valid date and will therefore throw.

#### Example

```ts
const dd = new DrawDays([Weekday.MONDAY, Weekday.THURSDAY]);
dd.get_next_draw_date("2024-06-05"); // 2024-06-06
```
