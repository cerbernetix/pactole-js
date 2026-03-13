# Pactole.js

A TypeScript library for managing lottery results.

> A Python version is also available: [pactole](https://github.com/cerbernetix/pactole).

## Installation

Add `pactole-js` to your project:

```sh
npm install pactole-js
```

## Documentation

See the complete documentation index: [Documentation](https://cerbernetix.github.io/pactole-js/). It's also published on ReadTheDocs: [pactole-js.readthedocs.io](https://pactole-js.readthedocs.io/en/latest/).

## Requirements

Requires **`Node.js`** (version `20` or newer).

## Usage

```ts
import * as pactole from 'pactole-js';
```

### EuroMillions lottery

```ts
import { EuroMillions } from 'pactole-js';

const lottery = new EuroMillions();

// Build a known ticket
const ticket = lottery.getCombination({ numbers: [3, 15, 22, 28, 44], stars: [2, 9] });

console.log(lottery.drawDays.days);
console.log(lottery.getLastDrawDate(new Date(2026, 1, 19)));
console.log(lottery.getNextDrawDate(new Date(2026, 1, 19)));
console.log(lottery.getNextDrawDate()); // From today
console.log(ticket.numbers.values);
console.log(ticket.stars.values);
console.log(ticket.rank);

// Generate 3 random combinations
const combinations = lottery.generate({ n: 3 });
console.log(combinations);
```

### EuroDreams lottery

```ts
import { EuroDreams } from 'pactole-js';

const lottery = new EuroDreams();

// Build a known ticket
const ticket = lottery.getCombination({ numbers: [2, 3, 5, 7, 9, 38], dream: [3] });

console.log(lottery.drawDays.days);
console.log(lottery.getLastDrawDate(new Date(2026, 1, 19)));
console.log(lottery.getNextDrawDate(new Date(2026, 1, 19)));
console.log(lottery.getNextDrawDate()); // From today
console.log(ticket.numbers.values);
console.log(ticket.dream.values);
console.log(ticket.rank);

// Generate 3 random combinations
const combinations = lottery.generate({ n: 3 });
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

For the changelog, see [CHANGELOG.md](https://github.com/cerbernetix/pactole-js/blob/main/CHANGELOG.md).

## License

MIT License - See [LICENSE](https://github.com/cerbernetix/pactole-js/blob/main/LICENSE) file for details.
