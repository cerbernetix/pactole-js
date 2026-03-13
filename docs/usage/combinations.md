# Combinations

Pactole.js exposes dedicated classes to represent and manipulate lottery combinations:

- `EuroMillionsCombination`
- `EuroDreamsCombination`

## Create combinations

Create combinations from explicit component values.

```ts
import { EuroDreamsCombination, EuroMillionsCombination } from 'pactole-js';

const euromillions = new EuroMillionsCombination({ numbers: [3, 15, 22, 28, 44], stars: [2, 9] });
const eurodreams = new EuroDreamsCombination({ numbers: [2, 3, 5, 7, 9, 38], dream: [3] });
```

You can also pass a flat sequence. Values are split automatically by component size.

```ts
import { EuroDreamsCombination, EuroMillionsCombination } from 'pactole-js';

const euromillions = new EuroMillionsCombination([3, 15, 22, 28, 44, 2, 9]);
const eurodreams = new EuroDreamsCombination([2, 3, 5, 7, 9, 38, 3]);
```

Create combinations from lexicographic rank values (per component).

```ts
import { EuroDreamsCombination, EuroMillionsCombination } from 'pactole-js';

const firstEuromillions = new EuroMillionsCombination({ numbers: 0, stars: 0 });
const firstEurodreams = new EuroDreamsCombination({ numbers: 0, dream: 0 });
```

## Read normalized values and metadata

Each combination exposes normalized component values and computed metadata.

```ts
import { EuroMillionsCombination } from 'pactole-js';

const combination = new EuroMillionsCombination({ numbers: [44, 3, 28, 22, 15], stars: [9, 2] });

console.log(combination.numbers.values); // [3, 15, 22, 28, 44]
console.log(combination.stars.values); // [2, 9]
console.log(combination.values); // Combined values from all components
console.log(combination.rank); // Global lexicographic rank
console.log(combination.combinations); // Total number of possible combinations
console.log(combination.minWinningRank); // Best rank value
console.log(combination.maxWinningRank); // Worst winning rank value
```

## Generate random combinations

Use `generate({ n })` to produce combinations with the same game rules.

```ts
import { EuroDreamsCombination } from 'pactole-js';

const template = new EuroDreamsCombination();
const generated = template.generate({ n: 3 });

for (const combination of generated) {
    console.log(combination);
}
```

## Compare combinations

The classes provide direct comparison and set-like operations.

```ts
import { EuroMillionsCombination } from 'pactole-js';

const reference = new EuroMillionsCombination({ numbers: [3, 15, 22, 28, 44], stars: [2, 9] });
const candidate = new EuroMillionsCombination({ numbers: [3, 15, 22, 30, 45], stars: [2, 10] });

console.log(reference.equals(candidate));
console.log(reference.includes({ components: { numbers: [3, 15, 22], stars: [2] } }));
console.log(reference.intersects({ combination: candidate }));
console.log(reference.intersection({ combination: candidate }).numbers.values);
```

## Compute winning ranks

Evaluate a played combination against a reference draw combination with `getWinningRank`.

```ts
import { EuroMillionsCombination } from 'pactole-js';

const draw = new EuroMillionsCombination({ numbers: [3, 15, 22, 28, 44], stars: [2, 9] });
const ticket = new EuroMillionsCombination({ numbers: [3, 15, 22, 30, 45], stars: [2, 10] });

const rank = draw.getWinningRank({ combination: ticket });
console.log(rank); // number rank value, or null if not winning
```

## Notes

- All APIs are synchronous unless otherwise documented. Random generation uses the library RNG helpers and accepts optional partitioning for rank-based sampling.
- Use the `copy()` family when you need to adjust `start`, `end`, or `count` while preserving other configuration values.
