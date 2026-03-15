# Pactole Python → TypeScript Port Plan

## Audit basis and parity target

- Current TypeScript implementation baseline aligns with Python `0.2.0`, with selective parity slices from `0.3.2` already ported in combinations (`generate`, `stored_rank`, rank-aware `copy`).
- Parity target remains Python `0.3.3` (including `cache_root_name`, draw-day refresh fixes, and FDJ parser/data refresh hardening).
- Upstream Python source of truth is GitHub (`cerbernetix/pactole`), not the local TypeScript workspace.
- Source audit scope: complete `src/pactole` module tree + API docs + tests inventory.
- Port goal: behavior parity in JavaScript semantics (not Python syntax parity).
- The ported code must stand on its own; comments and documentation may not reference the original Python source, the porting process, or any conversational/contextual detail.
- Runtime targets: Node.js `>=20` + modern browsers.
- Async boundary rule: async only for side effects (network and persistent storage I/O); pure logic remains sync.

## Current parity snapshot (2026-03-15)

- Implemented in TypeScript and test-covered:
    - `combinations/*` (including game presets and rank helpers), plus post-`0.2.0` updates from `0.3.2`.
    - `utils/days` (`Weekday`, `DrawDays`).
    - `utils/types`, `utils/system`, `utils/timeout`.
    - `utils/file` dual-runtime adapters (`node` + `browser`) and `File` abstraction.
    - `utils/cache` (`MemoryCache`, `TimeoutCache`, `FileCache`) over shared persistence contracts.
    - `data/models` (`WinningRank`, `DrawRecord`, `FoundCombination`, archive/manifest typings).
    - `data/base-parser` and `data/base-resolver` integrated with the async cache/file utility stack.
    - `data/providers/fdj` (`FDJResolver`, `FDJParser`, `FDJProvider`) and provider exports wiring.
    - `lottery/base-lottery` provider-first orchestration (`count`, `dump`, `get_records`, `find_records`, strict/non-strict rank filtering).
    - `lottery/euromillions` and `lottery/eurodreams` provider-first constructors with environment-driven defaults and optional provider injection.
- Not implemented yet (hard gaps):
    - None in the lottery layer; remaining parity work is package-level docs/finalization.
- Main drift from earlier plan assumptions:
    - Plan text assumed `0.3.3` baseline completion path, but repository state is effectively `0.2.0` + partial `0.3.2` in combinations.
    - `BaseLottery` and game wrappers are now migrated to `0.3.x` provider architecture; open work moved to documentation and final parity matrix consolidation.

## Upstream delta summary to include (`0.2.0` -> `0.3.3`)

- `0.3.0`: new data layer (`data/*`), provider architecture, cache/file/system/type utilities, lottery history APIs.
- `0.3.1`: provider `cache_root_name` support and draw-day refresh logic fix.
- `0.3.2`: `generate`, rank-aware `Combination.copy`, and non-negative integer assertions (partially already reflected in TS combinations).
- `0.3.3`: FDJ parser filtering hardening and refresh/manifest empty-source safeguards.

## Upstream fetch policy (mandatory)

- Always fetch Python implementation files from GitHub before porting a request.
- Always fetch matching upstream tests from GitHub for parity behavior.
- Always fetch source docstrings (and API docs pages when needed) to preserve documentation parity.
- Fetch API docs/changelog from GitHub when behavior or signatures are ambiguous.
- Pin analysis to a specific upstream ref (tag/commit) during each request and record it in plan updates.
- Never rely on locally opened files for Python source, since the local project contains the TypeScript port workspace only.

## Documentation parity policy (docstrings → TSDoc)

- Port Python docstrings into TypeScript TSDoc/JSDoc for all exported classes, functions, methods, interfaces, and types.
- Preserve documentation intent and structure: summary, parameters, returns, throws, and behavior notes.
- Port examples when meaningful, adapting syntax to TypeScript usage.
- Keep terminology and domain semantics consistent with upstream docs.
- API documentation generation must remain possible from TypeScript source comments.
- Documentation parity is incomplete unless each impacted public API includes all of: `description`, `@param`, `@returns`, `@throws` (when applicable), and at least one adapted usage example when upstream provides one.
- Any intentional omission/adaptation of upstream docstrings must be recorded in the per-request `Doc parity` section with rationale.
- Comments within source files must not reveal porting origins, upstream provenance, or internal conversation; keep notes strictly about implementation intent or domain behaviour.

## Test and coverage enforcement policy (mandatory)

- Always port and review matching upstream Python unit tests before finalizing a scope.
- Every touched behavior must be covered by parity tests in TypeScript, including edge cases and error branches.
- Coverage for touched files must remain full (`100%` statements/functions/lines/branches) before marking a scope `done`.
- If coverage is below full, the scope status must remain `in progress` and missing branches must be listed explicitly.
- Avoid synthetic tests that bypass real behavior unless required to hit JS-specific adaptation branches; document such cases in `Delta decisions`.

## Verified upstream source inventory (`src/pactole`)

- Package root
    - `__init__.py`
- `combinations`
    - `__init__.py`
    - `combination.py`
    - `lottery_combination.py`
    - `euromillions_combination.py`
    - `eurodreams_combination.py`
- `data`
    - `__init__.py`
    - `base_parser.py`
    - `base_resolver.py`
    - `base_provider.py`
    - `models.py`
    - `providers/__init__.py`
    - `providers/fdj.py`
- `lottery`
    - `__init__.py`
    - `base_lottery.py`
    - `euromillions.py`
    - `eurodreams.py`
- `utils`
    - `__init__.py`
    - `days.py`
    - `cache.py`
    - `file.py`
    - `timeout.py`
    - `system.py`
    - `types.py`

## Verified upstream unit-test inventory (`tests`)

- Test root
    - `conftest.py`
- `tests/combinations`
    - `test_combination.py`
    - `test_bound_combination.py`
    - `test_lottery_combination.py`
    - `test_euromillions_combination.py`
    - `test_eurodreams_combination.py`
- `tests/data`
    - `test_models.py`
    - `test_base_parser.py`
    - `test_base_resolver.py`
    - `test_base_provider.py`
    - `providers/test_fdj.py`
- `tests/lottery`
    - `test_base_lottery.py`
    - `test_euromillions.py`
    - `test_eurodreams.py`
- `tests/utils`
    - `test_types.py`
    - `test_system.py`
    - `test_weekday.py`
    - `test_draw_days.py`
    - `test_timeout.py`
    - `test_memory_cache.py`
    - `test_timeout_cache.py`
    - `test_file.py`
    - `test_file_class.py`
    - `test_file_cache.py`

## Correct implementation order (dependency-safe)

1. Package scaffolding + shared TS error/guard primitives
2. `combinations/combination` rank helpers
3. `combinations/combination` `Combination` class
4. `combinations/combination` `BoundCombination` class
5. `combinations/lottery_combination`
6. Game presets (`euromillions_combination`, `eurodreams_combination`)
7. `utils/days`
8. `utils/types`
9. `data/models`
10. `utils/timeout` + `utils/file` + `utils/cache`
11. `data/base_parser` + `data/base_resolver`
12. `data/providers/fdj`
13. `data/base_provider`
14. `lottery/base_lottery`
15. `utils/system`
16. `lottery/euromillions` + `lottery/eurodreams`
17. Package exports and docs alignment

Rationale: this mirrors upstream dependency flow and prevents rework (provider depends on data + cache + combinations + draw-day utilities; lottery depends on provider).

Implementation drift note:

- The current TS branch implemented lottery classes before the provider/data layer. Keep this as an accepted interim state, but do not mark lottery parity complete until provider-backed flows are wired and tested.

---

## Module: core (types, errors, serialization contracts)

- Public API summary
    - Shared scalar/union types (`DayInput`, `CombinationRank`, component maps, provider options).
    - Reusable domain errors (`PactoleError`, `ValidationError`, `ProviderError`, `CacheError`).
    - Serialization contracts for persisted draw records (JSON-safe DTOs).
- Atomic units to port (with dependencies)
    - `types.ts`: cross-module type aliases and interfaces. (no deps)
    - `errors.ts`: typed error classes. (`types.ts`)
    - `guards.ts`: runtime validators + assertions for public entry points. (`errors.ts`)
    - `serialization.ts`: date/record encode/decode helpers. (`types.ts`, `errors.ts`)
- Key decisions
    - Keep public errors stable and explicit; avoid throwing raw `TypeError` from internals.
    - Standardize dates as ISO strings at storage boundaries, `Date` objects in runtime APIs.
    - No async in this module.

## Module: utils/types and utils/system

- Public API summary
    - Numeric coercion helpers equivalent to Python `get_int` / `get_float` behavior, exposed with TypeScript camelCase names.
    - Dynamic import helper equivalent to `import_namespace` intent for Node/browser-safe resolution, exposed with a TypeScript camelCase name. Implement the helper only if native dynamic import is not enough.
- Atomic units to port (with dependencies)
    - `src/utils/types.ts`: numeric conversion helpers and edge-case handling.
    - `src/utils/system.ts`: namespace import utility with TS-safe return types.
- Key decisions
    - Keep conversion helpers synchronous and side-effect free.
    - Preserve coercion edge cases from Python tests before broad refactors.
    - `importNamespace` uses a controlled synchronous registry in TS instead of unrestricted module loading so the API stays deterministic across Node.js and browser bundlers.

## Module: dates

- Public API summary
    - `Weekday` (enum-like API + parsing from string/int/date).
    - `DrawDays` with `getLastDrawDate()` and `getNextDrawDate()`.
- Atomic units to port (with dependencies)
    - `weekday.ts`: weekday normalization/parsing arithmetic. (`core/types`, `core/errors`)
    - `draw-days.ts`: draw schedule logic and date traversal. (`weekday.ts`)
    - `index.ts` re-exports.
- Key decisions
    - Keep date arithmetic synchronous and timezone-stable (document local-time assumptions).
    - Accept broad JS inputs (`Date | number | string`) but normalize immediately.
    - Preserve Python behavior for `closest` flag and edge-day handling.

## Module: utils/file

- Public API summary
    - File abstraction/utilities used by provider and cache logic (`csv/json/text`, zip/csv helpers, fetch-content helpers, cache-path helpers).
- Atomic units to port (with dependencies)
    - `src/utils/file-types.ts`: `FileType` equivalent.
    - `src/utils/file-io.node.ts`: Node fs-backed helpers.
    - `src/utils/file-io.browser.ts`: browser-safe storage/fetch adaptations.
    - `src/utils/file.ts`: runtime-selected facade and JSON encoder behavior.
- Key decisions
    - All persistent I/O async.
    - Keep parser transformations synchronous once bytes/text are loaded.
    - Use platform-native `fetch` for remote content.

## Module: utils/timeout + utils/cache

- Public API summary
    - `Timeout`, `MemoryCache`, `TimeoutCache`, `FileCache` semantics and refresh-window behavior.
- Atomic units to port (with dependencies)
    - `src/utils/timeout.ts`: timeout lifecycle (start/stop/expired).
    - `src/utils/cache.memory.ts`: memory cache.
    - `src/utils/cache.timeout.ts`: timeout-aware in-memory cache.
    - `src/utils/cache.file.node.ts`: file-backed cache for Node.
    - `src/utils/cache.file.browser.ts`: browser-backed persistent cache (`localStorage`/`IndexedDB`).
    - `src/utils/cache.ts`: public cache exports and factory wiring.
- Key decisions
    - Keep cache interface async to unify Node and browser persistence.
    - Preserve Python refresh semantics exactly (including timeout expiration checks).
    - Keep deterministic serialization shape to avoid record drift.
    - `Timeout` remains synchronous and uses the ambient clock (`Date.now`) so fake timers can exercise parity behavior without a dedicated runtime adapter.

## Module: combinations/base

- Public API summary
    - Generic combination primitives (values, rank conversion hooks, comparisons/intersection/equality).
    - Existing rank helpers remain canonical (`comb`, `getCombinationRank`, `getCombinationFromRank`).
- Atomic units to port (with dependencies)
    - `comb-math.ts`: binomial/rank math (existing + parity hardening). (no deps)
    - `combination.ts`: immutable-ish core value object + compare helpers. (`comb-math.ts`, `core/errors`)
    - `combination.types.ts`: input and value types.
- Key decisions
    - Keep ranking and transformations synchronous.
    - Use deterministic sorting/normalization rules before rank operations.
    - Prefer readonly arrays externally; clone internally at boundaries.

## Module: combinations/bound

- Public API summary
    - `BoundCombination`: validates range/count constraints and supports generation/rank operations within bounds.
- Atomic units to port (with dependencies)
    - `bound-validators.ts`: range/count/value validation rules. (`core/guards`, `core/errors`)
    - `bound-combination.ts`: class implementation + generation API. (`combination/base`, `bound-validators.ts`)
    - `bound-generation.ts`: random generation and partition handling helpers. (`bound-combination.ts`)
- Key decisions
    - RNG remains sync; provide optional deterministic RNG injection for tests.
    - Validate eagerly on construction and on mutation-like operations.
    - Keep branch parity for invalid combinations and rank boundary cases.

## Module: combinations/lottery

- Public API summary
    - `LotteryCombination` compound model with named components.
    - `getCombinationFactory()` and component access helpers.
    - Winning-rank related helpers and comparison/intersection across components.
- Atomic units to port (with dependencies)
    - `lottery-combination.types.ts`: component maps, winning-rank shapes, factory signature.
    - `component-utils.ts`: component normalization/access (`getComponent`, `getComponentValues`, etc.).
    - `lottery-combination.ts`: main class (`generate`, `getCombination`, rank helpers). (`bound`, `component-utils.ts`)
    - `winning-rank.ts`: rank lookup/match utilities. (`lottery-combination.types.ts`)
- Key decisions
    - Keep all combination operations synchronous.
    - Preserve Python semantics for partial component inputs and missing component errors.
    - Document JS adaptation: no Python protocols; use TS interfaces/function types.

## Module: combinations/games (EuroMillions, EuroDreams)

- Public API summary
    - `EuroMillionsCombination` and `EuroDreamsCombination` presets (component bounds + defaults).
- Atomic units to port (with dependencies)
    - `euromillions-combination.ts`: preconfigured factory/constructor wrappers. (`lottery-combination`)
    - `eurodreams-combination.ts`: same pattern for EuroDreams. (`lottery-combination`)
    - `games/index.ts` exports.
- Key decisions
    - Keep constructors thin and data-driven.
    - Expose preset metadata for downstream lottery/provider wiring.

## Module: data/models

- Public API summary
    - Draw-history domain models: `DrawRecord`, `WinningRank`, `FoundCombination`, archive metadata/manifests.
- Atomic units to port (with dependencies)
    - `winning-rank.ts`: rank/winners/gain DTO + runtime validation.
    - `draw-record.ts`: typed record model + serialization helpers.
    - `found-combination.ts`: result pair (`record`, matched rank).
    - `archive-models.ts`: resolver/provider transport models.
- Key decisions
    - Keep models plain (interfaces + factories), not heavy classes unless behavior is needed.
    - Persist with JSON-safe shape only; rehydrate dates in parser/provider boundaries.

## Module: data/resolver

- Public API summary
    - `BaseResolver` abstraction to discover archive URLs/identifiers.
    - FDJ resolver implementation.
- Atomic units to port (with dependencies)
    - `base-resolver.ts`: abstract contract + optional manifest cache hooks.
    - `fdj-resolver.ts`: source-specific archive list discovery.
    - `resolver.types.ts`: archive manifest/entry types.
- Key decisions
    - Resolver I/O is async (network); parsing/discovery transformations stay sync.
    - Keep fetch transport pluggable (`fetch` injection) for tests and browser/Node compatibility.

## Module: data/parser

- Public API summary
    - `BaseParser` contract and FDJ parser turning source rows into `DrawRecord`.
- Atomic units to port (with dependencies)
    - `base-parser.ts`: parser interface/base class.
    - `fdj-parser.ts`: normalization and row mapping to typed records.
    - `parser-normalizers.ts`: string/number/date coercion helpers.
- Key decisions
    - Parsing remains synchronous once input payload is available.
    - Keep coercion strict: fail fast on malformed rows with typed parse errors.

## Module: data/providers/fdj

- Public API summary
    - `FDJResolver`, `FDJParser`, `FDJProvider` default upstream implementations.
- Atomic units to port (with dependencies)
    - `src/data/providers/fdj-resolver.ts`
    - `src/data/providers/fdj-parser.ts`
    - `src/data/providers/fdj-provider.ts`
    - `src/data/providers/index.ts`
- Key decisions
    - Preserve FDJ source normalization and mapping behavior.
    - Keep network/download logic async and pure parse stages sync.

## Module: data/provider

- Public API summary
    - `BaseProvider` orchestrating resolver + parser + cache + refresh policy.
    - FDJ provider presets.
- Atomic units to port (with dependencies)
    - `provider-options.ts`: constructor options and env-config mapping.
    - `base-provider.ts`: `load(force?)`, refresh checks, cache lifecycle.
    - `provider-refresh.ts`: draw-day/time + timeout refresh predicates.
    - `fdj-provider.ts`: default resolver/parser wiring for games.
- Key decisions
    - Provider load path is async end-to-end (`Promise<DrawRecord[]>`).
    - Expose explicit `force` refresh flag.
    - Keep refresh condition parity with Python 0.3.3 fix on draw-day logic.

## Module: lottery/base

- Public API summary
    - `BaseLottery` methods: `getLastDrawDate`, `getNextDrawDate`, `getCombination`, `generate`, `getRecords`, `findRecords`, `count`, `dump`.
- Atomic units to port (with dependencies)
    - `base-lottery.ts`: orchestration class around provider + combination factory.
    - `record-query.ts`: match/search helpers for `findRecords` and rank filtering.
    - `lottery-output.ts`: `dump()` shape conversion utilities.
- Key decisions
    - Date/combination helpers remain sync.
    - History methods that hit provider/cache are async (`getRecords`, `findRecords`, `count`, `dump` if provider load is needed).
    - Use async iterables only where large streams are useful; default to `Promise<ReadonlyArray<...>>` for ergonomic JS APIs.

## Module: lottery/games

- Public API summary
    - `EuroMillions` and `EuroDreams` ready-to-use lottery classes with default providers and environment/config overrides.
- Atomic units to port (with dependencies)
    - `euromillions.ts`: default draw days, provider wiring, env overrides.
    - `eurodreams.ts`: same pattern for EuroDreams.
    - `game-config.ts`: config parsing (env + explicit options precedence).
- Key decisions
    - Keep constructors sync; resolve async only when history is requested.
    - Preserve environment-variable style for Node, plus explicit options for browser contexts.

## Module: package API + docs

- Public API summary
    - Root exports aligned to Python conceptual modules (`combinations`, `dates`, `data`, `lottery`).
    - Migration notes for Python users (behavioral equivalence + JS-specific async differences).
- Atomic units to port (with dependencies)
    - `src/main.ts` export map updates.
    - `README.md` usage sections for Node and browser cache strategies.
    - TSDoc coverage updates for all newly ported public APIs.
    - `CHANGELOG.md` entries for parity milestones.
- Key decisions
    - Keep named exports stable and tree-shakeable.
    - Document all async boundaries explicitly with examples.

---

## Cross-module parity checklist

- Feature parity matrix (Python API → TS API) maintained per module before marking done.
- Behavior parity tests for:
    - `utils` coercion, timeout and cache behaviors from upstream tests.
    - Combination ranking/generation and boundary validation.
    - Draw-day computations and `closest` semantics.
    - Provider refresh logic (including draw-day refresh-time edge cases).
    - Lottery history helpers (`getRecords`, `findRecords`, `count`, `dump`).
- Cache parity tests for:
    - Node file persistence and cache-root configuration.
    - Browser storage fallback strategy (`localStorage` → IndexedDB).
- Public API docs updated after each module completion (not only at the end).

## Non-negotiable logic-preservation rules

- Do not change algorithms during first port pass (especially rank math, partitioned generation, refresh predicates).
- Keep branch behavior identical for invalid input and edge cases; only adapt exceptions to JS/TS style where required.
- Every behavior change requires explicit note in the parity matrix and test evidence.
- Port from source + tests together: no file is marked done without matching upstream test scenarios.

## API ergonomics decisions

- **Named-parameter mapping**: Python named-parameter usage is adapted to TypeScript object-destructured options for high-arity APIs. This is the preferred shape for constructors and functions with multiple optional parameters.
- **Optional-argument policy**: Optional arguments must be passed via destructured options objects only; positional optional parameters are not preserved.
- **Constructor shape**: Constructors and factory functions are normalized to either one required argument, or one required argument plus an options object.
- **Determinism hooks**: RNGs expose optional deterministic injection hooks for tests; `Math.random` is the default runtime RNG.
- **Operator mapping**: Python dunder/operator semantics are mapped to explicit JS methods (e.g., `equals`, `toString`, `hashCode`) where needed.
- **Data encoding**: Winning-rank tuple keys are adapted to string-key encodings with helper utilities to preserve lookup semantics.

## Cross-language adaptation matrix

### Python-specific features not portable 1:1 (or not needed in TS)

- **Python Protocols / TypedDict runtime assumptions**:
    - `Protocol` and `TypedDict` are static typing constructs only.
    - TS replacement: interfaces + runtime validators where input is untrusted.
- **Dataclass behaviors**:
    - `@dataclass` auto-generated methods (`repr`, structural init) do not map directly.
    - TS replacement: explicit interfaces + factory functions + targeted helper methods (`toDict`, `fromDict`).
- **Synchronous filesystem/network workflow**:
    - Python implementation uses synchronous-looking APIs over requests/files.
    - TS runtime constraints require async boundaries for network and persistence.
- **Python iterator/yield-first API defaults**:
    - Python returns iterators for some public APIs (`get_records`, `find_records`).
    - TS should prefer `Promise<ReadonlyArray<T>>` for default ergonomics, with optional async iterables only if justified by scale.
- **Dynamic import by dotted namespace string**:
    - Python `import_namespace("pkg.module.Class")` resolution is not directly equivalent in ESM/bundlers.
    - TS replacement should be constrained and validated (safe registry or controlled dynamic import mapping).
- **Path and OS conventions**:
    - Python `Path`/`~/.cache` assumptions are OS and process-user specific.
    - TS must use platform-safe path resolution in Node and a browser-safe alternative with explicit separation.
- **Regex/group behavior and locale parsing edge assumptions**:
    - Python parser tolerances (`str` coercion, locale decimal commas, regex group semantics) need explicit recreation in TS.
    - Keep behavioral parity, not implementation parity.

### TypeScript-specific features required to cover parity gaps

- **Dual-runtime architecture (Node + browser)**:
    - Introduce runtime adapters for file/cache/provider dependencies.
    - Keep one public API surface while delegating to environment-specific internals.
- **Async provider/cache contracts**:
    - Define promise-based contracts for resolver/provider/cache/file with strict return types.
    - Preserve sync behavior for pure computation modules.
- **Runtime validation layer**:
    - Add guards for parser/provider inputs where Python relied on duck typing.
    - Surface explicit typed errors instead of accidental `TypeError`/`undefined` failures.
- **Deterministic clock and RNG injection**:
    - Add injectable `now()` and RNG hooks in provider refresh and generation paths for stable parity tests.
- **Typed serialization boundaries**:
    - Centralize Date <-> ISO conversion and record normalization to avoid drift between in-memory types and persisted raw payloads.
- **Environment/config abstraction**:
    - Map Python env variables to Node-friendly options with precedence rules and browser-compatible overrides.
    - Keep provider class resolution explicit and testable.
- **Error surface normalization**:
    - Introduce domain errors (`ValidationError`, `ProviderError`, `CacheError`) where Python raised heterogeneous built-ins.

---

## Request-driven execution protocol (interactive implementation)

You can trigger work with plain requests, for example:

- `port this file`
- `port src/pactole/data/models.py`
- `port the classes X and Y from this file`
- `port only method get_combination from this file`

Interpretation rules:

1. `port this file` means the active target in the TS workspace, then infer and fetch the corresponding Python upstream file from GitHub.
2. `port the classes X and Y` means those classes plus all required side effects for parity (supporting types/helpers, exports, tests, and integration touchpoints).
3. If a requested scope depends on missing prerequisites, implement all required prerequisite slices needed for a correct and runnable result.
4. If a request is ambiguous, default to the smallest complete task that preserves behavior end-to-end.

For each request, the typical end-to-end workflow is:

1. Fetch upstream source + related tests/docs from GitHub and build a dependency map of impacted symbols/files.
2. Port the requested target and all necessary connected pieces (types/helpers/index exports/main exports/test fixtures).
3. Port source docstrings to TSDoc/JSDoc for all impacted public APIs.
4. Add/update tests that prove behavior parity for the requested capability.
5. Run targeted tests, then lint/type/build checks as needed.
6. Update the plan's status, record delta decisions, and propose the next logical request.

## File-by-file backlog map (reference sequence)

### Phase A — package skeleton and shared primitives

- `S1`: `src/pactole/__init__.py` → `src/main.ts` (initial export skeleton only) **(done 2026-03-14; skeleton currently re-exports combinations/lottery/utils only)**
- `S2`: create `src/core/types.ts` (shared aliases) **(not started)**
- `S3`: create `src/core/errors.ts` + `src/core/guards.ts` **(done 2026-03-14; added domain errors and minimal validation guards used by runtime utilities)**

### Phase B — utils foundation

- `U1`: `src/pactole/utils/__init__.py` → `src/utils/index.ts` (temporary exports) **(done 2026-03-14; currently only days exported)**
- `U2`: `src/pactole/utils/system.py` → `src/utils/system.ts`; scope: `import_namespace` / `importNamespace` **(done 2026-03-14; implemented registry-backed namespace resolution with parity tests and TypeScript naming alignment)**
- `U3`: `src/pactole/utils/types.py` → `src/utils/types.ts`; scope: `get_int`, `get_float` → `getInt`, `getFloat` **(done 2026-03-14; non-negative integer assertion remains canonical in `combinations/rank.ts`)**
- `U4`: `src/pactole/utils/days.py` → `src/utils/days.ts`; scope: `Weekday` **(done)**
- `U5`: `src/pactole/utils/days.py` → `src/utils/days.ts`; scope: `DrawDays` **(done)**
- `U6`: `src/pactole/utils/timeout.py` → `src/utils/timeout.ts`; scope: full file **(done 2026-03-14; ported lifecycle API and parity tests)**
- `U7`: `src/pactole/utils/file.py` → `src/utils/file.ts`; scope: file type + path/fetch/read/write helpers **(done 2026-03-14; dual-runtime adapter contract implemented with Node fs + browser storage backends, ZIP/CSV/JSON helpers, and `File` abstraction parity tests)**
- `U8`: `src/pactole/utils/cache.py` → `src/utils/cache.ts`; scope: `MemoryCache` **(done 2026-03-14; async-safe cache core ported with loader/transformer parity tests)**
- `U9`: `src/pactole/utils/cache.py` → `src/utils/cache.ts`; scope: `TimeoutCache` **(done 2026-03-14; timeout refresh semantics ported with fake-timer parity tests)**
- `U10`: `src/pactole/utils/cache.py` → `src/utils/cache.ts`; scope: `FileCache` **(done 2026-03-14; file-backed cache wired to shared file adapter with parity tests for load/force/clear behavior)**

### Phase C — combinations

- `C1`: `src/pactole/combinations/__init__.py` → `src/combinations/index.ts` (export map) **(done 2026-03-14)**
- `C2`: `src/pactole/combinations/combination.py` → `src/combinations/combination.ts`; scope: rank helpers (`comb`, rank encode/decode) **(done 2026-03-14; includes `0.3.2` generate/assert semantics)**
- `C3`: `src/pactole/combinations/combination.py` → `src/combinations/combination.ts`; scope: `Combination` class **(done 2026-03-07)**
- `C4`: `src/pactole/combinations/combination.py` → `src/combinations/combination.ts`; scope: `BoundCombination` class **(done 2026-03-08)**
- `C5`: `src/pactole/combinations/lottery_combination.py` → `src/combinations/lottery-combination.ts`; scope: constructor/properties/factory **(done 2026-03-08)**
- `C6`: same file; scope: generation and copy/get_combination methods **(done 2026-03-08)**
- `C7`: same file; scope: comparison APIs (`equals`, `includes`, `intersects`, `intersection`, `compares`) **(done 2026-03-08)**
- `C8`: same file; scope: rank/winning-rank helpers and utility accessors **(done 2026-03-08)**
- `C9`: `src/pactole/combinations/euromillions_combination.py` → `src/combinations/euromillions-combination.ts` **(done 2026-03-12)**
- `C10`: `src/pactole/combinations/eurodreams_combination.py` → `src/combinations/eurodreams-combination.ts` **(done 2026-03-12)**

### Phase D — data layer

- `D1`: `src/pactole/data/__init__.py` → `src/data/index.ts` (export map) **(done 2026-03-15; exports added for `models`, `base-parser`, `base-provider`, and `base-resolver`)**
- `D2`: `src/pactole/data/models.py` → `src/data/models.ts`; scope: `WinningRank`, `DrawRecord`, `FoundCombination`, manifest/archive types **(done 2026-03-15; flat-record serialization and factory-based rehydration parity covered in `tests/data/models.test.ts`)**
- `D3`: `src/pactole/data/base_parser.py` → `src/data/base-parser.ts` **(done 2026-03-15; parser base contract + combination factory normalization covered in `tests/data/base-parser.test.ts`)**
- `D4`: `src/pactole/data/base_resolver.py` → `src/data/base-resolver.ts` **(done 2026-03-15; async `TimeoutCache`-backed resolver behavior covered in `tests/data/base-resolver.test.ts`)**
- `D5`: `src/pactole/data/providers/fdj.py` → `src/data/providers/fdj.ts`; scope: resolver logic **(done 2026-03-15; archive-page template resolution and HTML `a[download]` extraction covered in `tests/data/providers/fdj.test.ts`)**
- `D6`: same file; scope: parser logic **(done 2026-03-15; date normalization, component mapping, and winning-rank extraction covered in `tests/data/providers/fdj.test.ts`)**
- `D7`: same file; scope: provider wiring + defaults **(done 2026-03-15; resolver-string coercion, parser default wiring, and draw-day refresh-time forwarding covered in `tests/data/providers/fdj.test.ts`)**
- `D8`: `src/pactole/data/providers/__init__.py` → `src/data/providers/index.ts` **(done 2026-03-15; provider barrel exports wired through `src/data/index.ts`)**
- `D9`: `src/pactole/data/base_provider.py` → `src/data/base-provider.ts`; scope: ctor/properties + refresh checks **(done 2026-03-15; draw-day threshold logic and timeout-gated refresh checks ported with async cache access)**
- `D10`: same file; scope: manifest/cache load + raw load + parsed load **(done 2026-03-15; manifest/data cache flows and raw/parsed load paths ported with parity tests)**
- `D11`: same file; scope: network/archive update pipeline and cache-root env behavior **(done 2026-03-15; source/archive refresh, zip/plain source handling, and `cache_root_name` precedence wired)**
- `D12`: post-`0.3.3` hardening in FDJ parser/provider (`RE_DISCARD`, empty source/archive handling, empty-manifest invalidation, empty CSV handling) **(done 2026-03-15; France-specific winner/gain filtering ported in `FDJParser`, with provider-side empty source/archive + manifest invalidation already covered in `BaseProvider` tests)**

### Phase E — lottery layer

- `L1`: `src/pactole/lottery/__init__.py` → `src/lottery/index.ts` **(done 2026-03-14)**
- `L2`: `src/pactole/lottery/base_lottery.py` → `src/lottery/base-lottery.ts`; scope: ctor/properties/date helpers/generate/get_combination **(done 2026-03-15; constructor migrated to provider-first composition with provider-delegated draw-day and combination accessors)**
- `L3`: same file; scope: history APIs (`count`, `dump`, `get_records`, `find_records`, private find helpers) **(done 2026-03-15; async count/dump/get-records/find-records with strict/non-strict winning-rank filters covered in `tests/lottery/base-lottery.test.ts`)**
- `L4`: `src/pactole/lottery/euromillions.py` → `src/lottery/euromillions.ts` **(done 2026-03-15; env-driven provider resolution and optional provider injection covered in `tests/lottery/euromillions.test.ts`)**
- `L5`: `src/pactole/lottery/eurodreams.py` → `src/lottery/eurodreams.ts` **(done 2026-03-15; env-driven provider resolution and optional provider injection covered in `tests/lottery/eurodreams.test.ts`)**

### Phase F — package finalization

- `P1`: finalize `src/main.ts` public exports to parity target **(in progress; utils exports now include `types`, `system`, `timeout`, `file`, and `cache`, and data exports now include `models`, `base-parser`, `base-provider`, and `base-resolver`; lottery `0.3.x` parity exports are now covered)**
- `P2`: README + migration notes for async boundaries and cache backends **(not started)**
- `P3`: parity matrix completion and final regression pass **(not started)**

## Gap register (authoritative)

- Remaining parity work:
    - Package/documentation finalization (`P1`/`P2`/`P3`) and public usage examples for provider-backed lottery APIs.
- Partial parity risks in currently ported areas:
    - End-to-end refresh behavior under live FDJ source volatility should continue to be exercised through integration tests.
    - Browser-runtime provider usage still depends on environment/registry setup and should be explicitly documented in usage guides.

## Technical challenges and solution directions

- Challenge: `BaseLottery` changed from synchronous factory wrapper (`0.2.0`) to provider-backed orchestration (`0.3.x`).
    - Solution: introduce a provider contract in TS (`load`, `loadRaw`, draw-day access, factory access) and migrate `BaseLottery` to provider composition while preserving synchronous date/combination helpers and making data access methods async.
- Challenge: Python file/cache stack is synchronous and filesystem-native; TS must support Node and browser with async persistence.
    - Solution: define async cache/file interfaces first, then provide Node and browser adapters under one facade; keep parser/model transformations pure and sync after I/O.
- Challenge: refresh logic depends on draw-day threshold and last-known record date with edge cases fixed in `0.3.1`/`0.3.3`.
    - Solution: port refresh predicates verbatim in staged helper functions with deterministic clock injection in tests (no real-time dependency).
- Challenge: FDJ parser has locale-formatted numeric fields, mixed key families, and country-specific duplicate fields.
    - Solution: port regex-driven key classification and discard rules (`*_en_france`) exactly; add focused tests for key collisions, unknown keys, and empty payload handling.
- Challenge: Python dataclasses (`DrawRecord`, `WinningRank`, `FoundCombination`) serialize with mixed date/object fields.
    - Solution: use strict TS interfaces plus explicit `toDict/fromDict` conversion helpers that normalize dates at boundaries and preserve winning-rank key conventions.
- Challenge: `cache_root_name` and env-driven provider class loading require controlled dynamic behavior in TS.
    - Solution: use explicit provider factory resolution and validated import helpers (`utils/system`), with safe defaults and clear errors when imports/constructors are invalid.

Additional consolidation decisions:

- Runtime validation scaffolding now starts in `src/core/errors.ts` and `src/core/guards.ts`; keep these internal-first until broader provider/data modules stabilize their public error surface.
- Utility APIs now follow TypeScript naming conventions at the public surface (`getInt`, `getFloat`, `importNamespace`), while documentation continues to track their Python parity origin.
- `DrawRecord` keeps flat dictionary keys (`draw_date`, `main_1`, `rank_1_gain`, etc.) for storage and provider transport parity, while runtime APIs expose camelCase class fields (`drawDate`, `deadlineDate`, `winningRanks`).
- `BaseResolver` remains cache-backed but async in TypeScript (`Promise` API) to align with shared persistence contracts while preserving Python refresh and force-load semantics.

Consolidation decisions from this audit:

- Prefer behavior parity over structural parity when Python language features do not map directly.
- Keep Python-named public semantics where they are user-facing, but expose idiomatic TS signatures (options objects + strict return types).
- Default to cross-runtime-safe abstractions first (provider/cache/file interfaces), then implement Node and browser adapters underneath.
- Treat `0.3.3` parser/provider hardening as mandatory parity, not optional enhancements.

## Next candidates

1. Add integration-style lottery tests that exercise `BaseLottery` against the real `FDJProvider` refresh pipeline with controlled fixtures.
2. Update README and docs usage pages with async lottery history API examples (`count`, `dump`, `get_records`, `find_records`) and provider injection patterns.
3. Complete parity matrix/final regression notes for `P3` with explicit mapping of Python `0.3.3` lottery APIs to TypeScript equivalents.

## Upstream refs pinned for this audit

- Tag `0.2.0` (`3009252831c4cef59e55c9cebd8b041b26cdacf0`)
    - https://github.com/cerbernetix/pactole/tree/0.2.0/src/pactole
    - https://github.com/cerbernetix/pactole/tree/0.2.0/tests
- Tag `0.3.3` (`b18a13bb7576c2bfe183b7d19db8676d83261eec`)
    - https://github.com/cerbernetix/pactole/tree/0.3.3/src/pactole
    - https://github.com/cerbernetix/pactole/tree/0.3.3/tests
    - https://github.com/cerbernetix/pactole/blob/0.3.3/CHANGELOG.md
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/utils/types.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/utils/system.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/utils/timeout.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/utils/file.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/utils/cache.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/data/models.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/data/base_parser.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/data/base_resolver.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/data/providers/fdj.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/data/providers/__init__.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/lottery/base_lottery.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/lottery/euromillions.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/src/pactole/lottery/eurodreams.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/utils/test_types.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/utils/test_system.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/utils/test_timeout.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/utils/test_file.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/utils/test_file_class.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/utils/test_memory_cache.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/utils/test_timeout_cache.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/utils/test_file_cache.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/data/test_models.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/data/test_base_parser.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/data/test_base_resolver.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/data/providers/test_fdj.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/lottery/test_base_lottery.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/lottery/test_euromillions.py
    - https://raw.githubusercontent.com/cerbernetix/pactole/0.3.3/tests/lottery/test_eurodreams.py

## Impact map

- Source files touched:
    - `src/core/errors.ts`
    - `src/core/guards.ts`
    - `src/utils/file.ts`
    - `src/utils/cache.ts`
    - `src/utils/types.ts`
    - `src/utils/system.ts`
    - `src/utils/timeout.ts`
    - `src/utils/index.ts`
    - `src/data/models.ts`
    - `src/data/base-parser.ts`
    - `src/data/base-resolver.ts`
    - `src/data/base-provider.ts`
    - `src/data/providers/fdj.ts`
    - `src/data/providers/index.ts`
    - `src/data/index.ts`
    - `src/lottery/base-lottery.ts`
    - `src/lottery/euromillions.ts`
    - `src/lottery/eurodreams.ts`
    - `src/main.ts`
    - `README.md`
- Test files added:
    - `tests/utils/file.test.ts`
    - `tests/utils/file-class.test.ts`
    - `tests/utils/memory-cache.test.ts`
    - `tests/utils/timeout-cache.test.ts`
    - `tests/utils/file-cache.test.ts`
    - `tests/utils/types.test.ts`
    - `tests/utils/system.test.ts`
    - `tests/utils/timeout.test.ts`
    - `tests/data/models.test.ts`
    - `tests/data/base-parser.test.ts`
    - `tests/data/base-resolver.test.ts`
    - `tests/data/base-provider.test.ts`
    - `tests/data/providers/fdj.test.ts`
    - `tests/lottery/base-lottery.test.ts`
    - `tests/lottery/euromillions.test.ts`
    - `tests/lottery/eurodreams.test.ts`
- Export surface touched:
    - `src/data/providers/index.ts`
    - `src/data/providers/fdj.ts`
    - `src/data/index.ts`
    - root package re-export via `src/main.ts` → `src/data/index.ts`
    - `src/utils/index.ts`
    - root package re-export via existing `src/main.ts` → `src/utils/index.ts`

## Doc parity

- Ported Python docstring intent into TSDoc for `Timeout`, `getInt`, `getFloat`, and `importNamespace`.
- Ported Python docstring intent into TSDoc for `ensureDirectory`, `getCachePath`, `fetchContent`, `readZipFile`, `readCsvFile`, `writeCsvFile`, `writeJsonFile`, `File`, `MemoryCache`, `TimeoutCache`, and `FileCache`.
- Ported Python docstring intent into TSDoc for `WinningRank`, `DrawRecord`, `FoundCombination`, `BaseParser`, and `BaseResolver`.
- Ported Python docstring intent into TSDoc for `BaseProvider` and related provider options, including refresh semantics and cache-root precedence behavior.
- Ported Python docstring intent into TSDoc for `FDJResolver`, `FDJParser`, and `FDJProvider`, including parser filtering behavior and provider wiring defaults.
- Ported Python docstring intent into TSDoc for `BaseLottery`, `EuroMillions`, and `EuroDreams`, including provider-first constructor behavior and async history API semantics.
- Adapted `importNamespace` documentation to explain the TS-specific registry constraint; omitted Python `importlib` implementation details because they do not apply to ESM/bundler runtimes.
- Adapted `FileType` from Python `Enum` to a const object + string-literal union to satisfy TypeScript `erasableSyntaxOnly` constraints while preserving API semantics.
- Adapted Python `datetime.date` fields to UTC-safe `Date` values in runtime APIs, while preserving ISO date-string serialization semantics at dictionary boundaries.
- Added a brief README usage example for the new exported utility APIs.

## Living-plan update policy (must evolve during implementation)

After every implementation request, update this plan file with:

- Consolidation rule: record updates directly in the relevant canonical sections (backlog item statuses, module notes, and parity/checklist sections) instead of adding standalone dated request-update sections.

1. `Status` for touched backlog items (`not started` → `in progress` → `done`).
2. `Completed` note: what file scope was ported and which parity tests were added.
3. `Delta decisions`: any new async/sync or API adaptation decisions discovered.
4. `Next candidates`: 1–3 most logical follow-up requests.
5. `Impact map`: dependencies touched (source files, tests, exports) for traceability.
6. `Upstream refs`: GitHub URLs + tag/commit used for source/test/doc review.
7. `Doc parity`: which docstrings were ported, adapted, or intentionally omitted (with reason).

Status conventions:

- `not started`: untouched.
- `in progress`: partially ported (some scopes done, some pending).
- `done`: implementation + tests + checks passed for planned scope.
- `blocked`: cannot proceed without external decision or missing dependency.

This plan is authoritative and must be edited continuously as work progresses; it is not a static document.

## Per-request done criteria

1. Requested capability is fully ported and runnable in the TS codebase (not partial/inert).
2. Required side effects are completed: helpers/types, exports, and test wiring are updated.
3. TSDoc/JSDoc parity is added for all impacted public APIs, preserving upstream documentation intent.
4. Behavior parity tests are added/updated from corresponding Python tests.
5. Type checks/lint/tests pass locally for impacted scope (and broader checks where needed), with full coverage for touched files.
6. Plan notes record any intentional JS semantic adaptation and rationale.

## Milestone gates (definition of done per module)

1. Public surface documented (types + signatures + async/sync contract).
2. Atomic units implemented with unit tests and 100% branch coverage for modified code.
3. Module parity checks passed against Python fixtures/cases.
4. Exports and docs updated.
5. No unresolved TODOs before moving to next module.
