import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    clearNamespaceRegistry,
    getEnvironmentValue,
    importNamespace,
    registerNamespace,
    unregisterNamespace
} from 'src/utils/index.ts';

class ExampleResource {}

describe('importNamespace', () => {
    afterEach(() => {
        clearNamespaceRegistry();
        registerNamespace('pactole.utils.system', {
            getEnvironmentValue,
            importNamespace,
            registerNamespace,
            unregisterNamespace,
            clearNamespaceRegistry
        });
        vi.unstubAllEnvs();
    });

    it('loads a registered resource', () => {
        registerNamespace('pactole.data.providers.fdj', { FDJResolver: ExampleResource });

        const resource = importNamespace<typeof ExampleResource>('pactole.data.providers.fdj.FDJResolver');

        expect(resource).toBe(ExampleResource);
        expect(resource.name).toBe('ExampleResource');
    });

    it('rejects invalid namespace formats', () => {
        expect(() => importNamespace('pactole')).toThrow('Invalid namespace format: pactole');
        expect(() => importNamespace('.')).toThrow('Invalid namespace format: .');
        expect(() => importNamespace(123 as unknown as string)).toThrow('namespace must be a string');
    });

    it('raises for missing modules', () => {
        expect(() => importNamespace('pactole.utils.missing_module.Foo')).toThrow(
            "Cannot import module 'pactole.utils.missing_module'"
        );
    });

    it('raises for missing resources', () => {
        expect(() => importNamespace('pactole.utils.system.MissingClass')).toThrow(
            "Resource 'MissingClass' not found in module 'pactole.utils.system'"
        );
    });

    it('supports unregistering modules', () => {
        registerNamespace('pactole.example', { ExampleResource });
        expect(unregisterNamespace('pactole.example')).toBe(true);
        expect(unregisterNamespace('pactole.example')).toBe(false);
    });
});

describe('getEnvironmentValue', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('returns the environment value when present', () => {
        vi.stubEnv('PACTOLE_EXAMPLE', 'configured');

        expect(getEnvironmentValue('PACTOLE_EXAMPLE')).toBe('configured');
        expect(getEnvironmentValue('PACTOLE_EXAMPLE', 'fallback')).toBe('configured');
    });

    it('returns the fallback when the variable is missing', () => {
        expect(getEnvironmentValue('PACTOLE_MISSING', 'fallback')).toBe('fallback');
    });

    it('returns undefined when the variable is missing and no fallback is provided', () => {
        expect(getEnvironmentValue('PACTOLE_MISSING')).toBeUndefined();
    });
});
