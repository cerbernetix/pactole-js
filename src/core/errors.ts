/**
 * Base error class for domain-specific runtime failures.
 *
 * Subclasses automatically receive a `name` matching their constructor so that
 * `error.name` reflects the concrete error type in stack traces and logs.
 */
export class PactoleError extends Error {
    /**
     * @param message - Human-readable description of the failure.
     */
    public constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}

/**
 * Thrown when a public API receives an argument that fails a precondition check.
 *
 * @example
 * ```ts
 * throw new ValidationError('count must be a positive integer');
 * ```
 */
export class ValidationError extends PactoleError {}

/**
 * Thrown when a data provider fails to load or resolve lottery records.
 */
export class ProviderError extends PactoleError {}

/**
 * Thrown when a cache backend encounters a read, write, or delete failure.
 */
export class CacheError extends PactoleError {}
