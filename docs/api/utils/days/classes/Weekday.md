[**pactole-js**](../../../README.md)

***

# Class: Weekday

Defined in: [utils/days.ts:59](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L59)

Enumeration for the days of the week.

A `Weekday` behaves like an enumeration of the seven weekdays.  Calling
implementation: calling the constructor or `Weekday.from()` with a value
returns one of the predefined singletons (e.g. `Weekday.MONDAY`).  The
class provides numerous helpers for navigating and comparing weekdays,
including methods that return the next/previous occurrence, compute the
distance between days, and translate between `Date` objects and weekday
values.

Input values accepted everywhere include:
- an integer 0–6 (or any integer, will be taken modulo 7)
- a floating-point number interpreted as a Unix timestamp in seconds
- a string containing either a day name (case-insensitive) or an ISO date
  (`YYYY-MM-DD`)
- a `Date` object
- another `Weekday` instance

Invalid or unrecognizable inputs will cause the factory methods to throw a
`TypeError` or `RangeError`.

All public operations are synchronous and side‑effect free.

Examples:
```ts
Weekday.from(0) === Weekday.MONDAY;
Weekday.from("2024-01-01"); // Monday
Weekday.from(new Date(2024, 0, 1)); // Monday
Weekday.MONDAY.next(); // Tuesday
Weekday.FRIDAY.next([Weekday.MONDAY, Weekday.WEDNESDAY]); // Monday
```

## Properties

### value

> `readonly` **value**: `number`

Defined in: [utils/days.ts:64](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L64)

The internal value of the weekday, normalized to the range 0..6.  This is
used for all internal calculations and comparisons.

***

### FRIDAY

> `readonly` `static` **FRIDAY**: `Weekday`

Defined in: [utils/days.ts:76](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L76)

***

### MONDAY

> `readonly` `static` **MONDAY**: `Weekday`

Defined in: [utils/days.ts:72](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L72)

***

### SATURDAY

> `readonly` `static` **SATURDAY**: `Weekday`

Defined in: [utils/days.ts:77](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L77)

***

### SUNDAY

> `readonly` `static` **SUNDAY**: `Weekday`

Defined in: [utils/days.ts:78](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L78)

***

### THURSDAY

> `readonly` `static` **THURSDAY**: `Weekday`

Defined in: [utils/days.ts:75](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L75)

***

### TUESDAY

> `readonly` `static` **TUESDAY**: `Weekday`

Defined in: [utils/days.ts:73](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L73)

***

### WEDNESDAY

> `readonly` `static` **WEDNESDAY**: `Weekday`

Defined in: [utils/days.ts:74](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L74)

## Methods

### closest()

> **closest**(`day?`): `number`

Defined in: [utils/days.ts:367](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L367)

Days to the closest occurrence of `day`, positive for future, negative
for past.

If `day` equals `this` returns `0`.  This method chooses the shorter of
the forward (`until`) and backward (`since`) distances; when equal the
forward distance is returned.

#### Parameters

##### day?

target weekday.

[`DayInput`](../type-aliases/DayInput.md) | `Weekday` | `null`

#### Returns

`number`

signed distance in days.

#### Example

```ts
Weekday.MONDAY.closest(Weekday.FRIDAY); // -3 (closest is previous)
Weekday.MONDAY.closest(Weekday.SUNDAY); // 6
```

***

### closest\_date()

> **closest\_date**(`from_date?`): `Date`

Defined in: [utils/days.ts:461](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L461)

Closest calendar date with this weekday (past or future).

#### Parameters

##### from\_date?

reference date; defaults to today.

[`DayInput`](../type-aliases/DayInput.md) | `null`

#### Returns

`Date`

#### Example

```ts
Weekday.MONDAY.closest_date("2024-01-03"); // 2024-01-01
```

***

### furthest()

> **furthest**(`day?`): `number`

Defined in: [utils/days.ts:391](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L391)

Signed days to the furthest occurrence of `day` from `this`.

The complement of [closest](#closest); returns `7` if `day === this`.

#### Parameters

##### day?

target weekday.

[`DayInput`](../type-aliases/DayInput.md) | `Weekday` | `null`

#### Returns

`number`

signed distance in days.

#### Example

```ts
Weekday.MONDAY.furthest(Weekday.FRIDAY); // 4 (Friday in future)
Weekday.MONDAY.furthest(Weekday.MONDAY); // 7
```

***

### furthest\_date()

> **furthest\_date**(`from_date?`): `Date`

Defined in: [utils/days.ts:484](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L484)

Furthest calendar date with this weekday from `from_date`.

When `from_date` already matches the weekday, the result is exactly one
week later.

#### Parameters

##### from\_date?

[`DayInput`](../type-aliases/DayInput.md) | `null`

#### Returns

`Date`

#### Example

```ts
Weekday.MONDAY.furthest_date("2024-01-01"); // 2024-01-08
```

***

### next()

> **next**(`days?`): `Weekday`

Defined in: [utils/days.ts:268](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L268)

Get the next weekday after `this`, optionally restricted to a set of days.

If `days` is `null` or `undefined`, simply returns the following day of
the week (e.g. Monday → Tuesday).  When a target or collection of targets
is provided, the method finds the next occurrence among them, wrapping
back to the first candidate if necessary.

#### Parameters

##### days?

target day(s) as a `DayInput` or iterable thereof.

[`DayInput`](../type-aliases/DayInput.md) | `Weekday` | `Iterable`\<DayInput \| Weekday, `any`, `any`\> | `null`

#### Returns

`Weekday`

the `Weekday` representing the next day.

#### Throws

TypeError when an element of `days` cannot be converted.

#### Example

```ts
Weekday.WEDNESDAY.next(); // Thursday
Weekday.WEDNESDAY.next(Weekday.MONDAY); // Monday (wraps)
Weekday.FRIDAY.next([1, 3]); // Tuesday (1=Tuesday,3=Thursday)
```

***

### next\_date()

> **next\_date**(`from_date?`, `closest?`): `Date`

Defined in: [utils/days.ts:416](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L416)

Calculate the next calendar date falling on this weekday.

#### Parameters

##### from\_date?

starting point (see [Weekday.get\_date](#get_date)); defaults
                   to today when omitted.

[`DayInput`](../type-aliases/DayInput.md) | `null`

##### closest?

`boolean` = `false`

if true, return `from_date` when it already matches.

#### Returns

`Date`

a `Date` for the next matching weekday.

#### Throws

TypeError/RangeError from [Weekday.get\_date](#get_date) on invalid input.

#### Example

```ts
Weekday.FRIDAY.next_date("2024-01-03"); // 2024-01-05
Weekday.WEDNESDAY.next_date(new Date(2024, 0, 3), true); // same day
```

***

### previous()

> **previous**(`days?`): `Weekday`

Defined in: [utils/days.ts:294](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L294)

Get the previous weekday before `this`, optionally restricted to targets.

Behavior mirrors [next](#next) but searches backward; wrapping occurs
when no earlier candidate exists.

#### Parameters

##### days?

single or multiple `DayInput` targets.

[`DayInput`](../type-aliases/DayInput.md) | `Weekday` | `Iterable`\<DayInput \| Weekday, `any`, `any`\> | `null`

#### Returns

`Weekday`

the previous matching `Weekday`.

#### Throws

TypeError when an element of `days` cannot be converted.

***

### previous\_date()

> **previous\_date**(`from_date?`, `closest?`): `Date`

Defined in: [utils/days.ts:439](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L439)

Calendar date of the previous occurrence of this weekday.

Parameters mirror [next\_date](#next_date).

#### Parameters

##### from\_date?

[`DayInput`](../type-aliases/DayInput.md) | `null`

##### closest?

`boolean` = `false`

#### Returns

`Date`

#### Example

```ts
Weekday.MONDAY.previous_date("2024-01-03"); // 2024-01-01
Weekday.WEDNESDAY.previous_date(new Date(2024,0,3), true); // same day
```

***

### since()

> **since**(`day?`): `number`

Defined in: [utils/days.ts:345](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L345)

Number of days since the previous occurrence of a given weekday.

Works like [until](#until) but counts backward; result spans `1..7`.

#### Parameters

##### day?

target weekday.

[`DayInput`](../type-aliases/DayInput.md) | `Weekday` | `null`

#### Returns

`number`

days since last target.

#### Example

```ts
Weekday.WEDNESDAY.since(Weekday.MONDAY); // 2
Weekday.MONDAY.since(Weekday.MONDAY); // 7
```

***

### toString()

> **toString**(): `string`

Defined in: [utils/days.ts:503](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L503)

Return the uppercase name of the weekday (e.g. "MONDAY").

This is primarily useful for debugging and logging.

#### Returns

`string`

***

### until()

> **until**(`day?`): `number`

Defined in: [utils/days.ts:326](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L326)

Number of days until the next occurrence of a given weekday.

If `day` is omitted the current weekday is used.  The returned value is in
the range `1..7` (returning 7 if the target is the same as `this`).

#### Parameters

##### day?

target weekday (see class description).

[`DayInput`](../type-aliases/DayInput.md) | `Weekday` | `null`

#### Returns

`number`

days until next target.

#### Example

```ts
Weekday.WEDNESDAY.until(Weekday.FRIDAY); // 2
Weekday.MONDAY.until(Weekday.MONDAY); // 7
```

***

### from()

> `static` **from**(`value?`): `Weekday`

Defined in: [utils/days.ts:163](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L163)

Create a `Weekday` instance from a variety of inputs.

A static factory wrapper that provides a more descriptive name than a
direct constructor call and centralizes conversion logic.

#### Parameters

##### value?

optional weekday input (see class description); `undefined`
               or `null` yields the current day.

[`DayInput`](../type-aliases/DayInput.md) | `Weekday` | `null`

#### Returns

`Weekday`

the corresponding singleton `Weekday`.

#### Throws

TypeError if `value` is not convertible.

#### Example

```ts
Weekday.from("monday");
Weekday.from(5); // Saturday
```

***

### get\_date()

> `static` **get\_date**(`from?`): `Date`

Defined in: [utils/days.ts:196](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L196)

Normalize a `DayInput` into a native `Date` object.

The argument may be a timestamp (number), an ISO date string, or a
`Date` instance; `null`/`undefined` returns `new Date()` (today).  This
helper is shared by the weekday/date methods below.

#### Parameters

##### from?

input value to coerce.

[`DayInput`](../type-aliases/DayInput.md) | `null`

#### Returns

`Date`

the corresponding `Date`.

#### Throws

TypeError if the argument is of an unsupported type.

#### Throws

RangeError if a string is not a valid ISO date.

#### Example

```ts
Weekday.get_date("2024-01-01");
Weekday.get_date(1672531200); // seconds since epoch
```

***

### get\_day()

> `static` **get\_day**(`value?`): `Weekday`

Defined in: [utils/days.ts:174](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L174)

Identical to [from](#from); included as an alternate name for clarity,
matching other public APIs.

#### Parameters

##### value?

see [from](#from)

[`DayInput`](../type-aliases/DayInput.md) | `Weekday` | `null`

#### Returns

`Weekday`

the corresponding `Weekday`.

***

### today()

> `static` **today**(): `Weekday`

Defined in: [utils/days.ts:226](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L226)

Return the current weekday using the system clock.

#### Returns

`Weekday`

the `Weekday` corresponding to `new Date().getDay()`.
