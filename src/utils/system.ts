import { assert, assertString } from '../core/guards.ts';

export type NamespaceModule = Readonly<Record<string, unknown>>;

type RuntimeProcess = {
    env?: Record<string, string | undefined>;
};

const namespaceRegistry = new Map<string, NamespaceModule>();

const createImportError = (message: string): Error => {
    const error = new Error(message);
    error.name = 'ImportError';
    return error;
};

const parseNamespace = (namespace: unknown): { moduleName: string; resourceName: string } => {
    assertString(namespace, 'namespace');

    const normalized = namespace.trim();
    const separator = normalized.lastIndexOf('.');

    assert(separator > 0 && separator < normalized.length - 1, `Invalid namespace format: ${String(namespace)}`);

    return {
        moduleName: normalized.slice(0, separator),
        resourceName: normalized.slice(separator + 1)
    };
};

/**
 * Register a module namespace in the controlled runtime registry.
 *
 * This adapts Python's dotted-namespace import behavior to environments where
 * arbitrary synchronous module loading is not available or not safe.
 *
 * @param moduleName - Dotted module name.
 * @param moduleExports - Named resources exported by the module.
 * @throws ValidationError When the module name is invalid.
 *
 * @example
 * ```ts
 * registerNamespace('pactole.utils.system', { Example: class Example {} });
 * ```
 */
export function registerNamespace(moduleName: string, moduleExports: NamespaceModule): void {
    const normalized = moduleName.trim();
    assert(
        normalized.length > 0 && !normalized.startsWith('.') && !normalized.endsWith('.'),
        `Invalid namespace format: ${moduleName}`
    );
    namespaceRegistry.set(normalized, moduleExports);
}

/**
 * Remove a registered module namespace.
 *
 * @param moduleName - Dotted module name.
 * @returns `true` when a module was removed.
 */
export function unregisterNamespace(moduleName: string): boolean {
    return namespaceRegistry.delete(moduleName.trim());
}

/**
 * Clear the namespace registry.
 */
export function clearNamespaceRegistry(): void {
    namespaceRegistry.clear();
}

/**
 * Read an environment variable from the current runtime.
 *
 * The lookup is intentionally tolerant of non-Node runtimes where `process`
 * may be absent. In those environments the provided fallback value is
 * returned, or `undefined` when no fallback is supplied.
 *
 * @param key - Environment variable name.
 * @param defaultValue - Optional fallback returned when the variable is not set.
 * @returns The environment value or the provided fallback.
 *
 * @example
 * ```ts
 * const cacheRoot = getEnvironmentValue('PACTOLE_CACHE_ROOT', 'pactole');
 * ```
 */
export function getEnvironmentValue(key: string): string | undefined;
export function getEnvironmentValue(key: string, defaultValue: string): string;
export function getEnvironmentValue(key: string, defaultValue?: string): string | undefined {
    const runtime = globalThis as { process?: RuntimeProcess };
    return runtime.process?.env?.[key] ?? defaultValue;
}

/**
 * Import a resource from a dotted namespace string.
 *
 * Unlike the Python implementation, this function resolves modules from an
 * explicit registry rather than performing unrestricted runtime imports. This
 * keeps the behavior deterministic across Node.js and browser bundlers while
 * preserving the same caller-facing namespace format.
 *
 * @param namespace - Namespace string in the form `module.resource`.
 * @returns The registered resource.
 * @throws ValidationError When the namespace format is invalid.
 * @throws Error Named `ImportError` when the module is not registered.
 * @throws ReferenceError When the resource is not exported by the module.
 *
 * @example
 * ```ts
 * class Example {}
 * registerNamespace('pactole.example', { Example });
 * const resource = importNamespace<typeof Example>('pactole.example.Example');
 * ```
 */
export function importNamespace<T>(namespace: string): T {
    const { moduleName, resourceName } = parseNamespace(namespace);
    const moduleExports = namespaceRegistry.get(moduleName);

    if (moduleExports === undefined) {
        throw createImportError(`Cannot import module '${moduleName}'`);
    }

    if (!Object.hasOwn(moduleExports, resourceName)) {
        throw new ReferenceError(`Resource '${resourceName}' not found in module '${moduleName}'`);
    }

    return moduleExports[resourceName] as T;
}

registerNamespace('pactole.utils.system', {
    getEnvironmentValue,
    importNamespace,
    registerNamespace,
    unregisterNamespace,
    clearNamespaceRegistry
});
