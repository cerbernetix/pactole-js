# Pactole.js

A TypeScript library for managing lottery results.

## Installation

```sh
npm install pactole-js
```

## Documentation

See the complete documentation index: [Documentation](https://cerbernetix.github.io/pactole-js/).

## Requirements

Requires **`Node.js`** (version `20` or newer).

## Usage

```typescript
import { Combination } from 'pactole-js';
```

### EuroMillions combinations

```typescript
import { EuroMillionsCombination } from 'pactole-js';

// Build a known combination
const euroMillions = new EuroMillionsCombination({ numbers: [3, 15, 22, 28, 44], stars: [2, 9] });

console.log(euroMillions.numbers.values);
console.log(euroMillions.stars.values);
console.log(euroMillions.rank);

// Generate 3 random combinations
const combinations = new EuroMillionsCombination().generate({ n: 3 });
console.log(combinations);
```

### EuroDreams combinations

```typescript
import { EuroDreamsCombination } from 'pactole-js';

// Build a known combination
const euroDreams = new EuroDreamsCombination({ numbers: [2, 3, 5, 7, 9, 38], dream: [3] });

console.log(euroDreams.numbers.values);
console.log(euroDreams.dream.values);
console.log(euroDreams.rank);

// Generate 3 random combinations
const combinations = new EuroDreamsCombination().generate({ n: 3 });
console.log(combinations);
```

---

## Scripts

- `dev`: Start development server with Vite
- `docs:api`: Generate the API documentation
- `build`: Build the library
- `build:lib`: Build the library only
- `format`: Format the project with Prettier
- `format:check`: Check formatting with Prettier
- `test`: Run tests with Vitest
- `test:coverage`: Run tests with coverage
- `test:watch`: Run tests in watch mode with coverage output
- `lint`: Lint code with ESLint and Prettier checks

---

## Changes

For the changelog, see [CHANGELOG.md](CHANGELOG.md).

## License

MIT License - See LICENSE file for details.
