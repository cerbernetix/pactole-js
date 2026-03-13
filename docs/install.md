# Installation

Pactole.js is a TypeScript library for managing lottery results.

## Requirements

Pactole.js requires Node.js 20 or newer.

The dependencies are managed by `npm`.

## Install the package

Install the published package with `npm`:

```sh
npm install pactole-js
```

## Install from source

To install the latest source version directly from GitHub:

```sh
npm install git+https://github.com/cerbernetix/pactole-js.git
```

## Development setup

Clone the repository:

```sh
git clone https://github.com/cerbernetix/pactole-js.git
cd pactole-js
npm install
```

`npm install` installs runtime and development dependencies by default.

## Optional: runtime-only environment

If you only need runtime dependencies, omit development dependencies:

```sh
npm install --omit=dev
```

## Development

- Run tests:

```bash
npm run test
```

```bash
npm run test:coverage
```

## Build

- Build the library:

```bash
npm run build
```

## API Reference

- Generate API docs from TSDoc comments:

```bash
npm run docs:api
```
