[**pactole-js**](../../../README.md)

***

# Type Alias: DayInput

> **DayInput** = `number` \| `string` \| `Date`

Defined in: [utils/days.ts:14](https://github.com/cerbernetix/pactole-js/blob/3256e82e2980c5101bbcdc138c2146981a483fd1/src/utils/days.ts#L14)

A union describing all acceptable inputs for the various weekday and date
helper methods.

- **number**: interpreted as a weekday index (0 = Monday) if integral; a
  non‑integer value is treated as a Unix timestamp in **seconds**.
- **string**: either a day name (`"monday"` etc.) or an ISO date
  (`"YYYY-MM-DD"`).  Invalid strings produce a `RangeError` during parsing.
- **Date**: a native JS `Date` object.

`Weekday` instances themselves are also accepted by most helpers, but are
not included in this alias to avoid a circular type definition.
