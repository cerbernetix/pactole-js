import terser from '@rollup/plugin-terser';
import { resolve } from 'path';
import type { AliasOptions, ESBuildOptions } from 'vite';
import { defineConfig, type ViteUserConfig } from 'vitest/config';

// Removed Svelte, open-graph and static-copy plugins to keep the config focused on the library
import packageInfo from './package.json';

const baseUrl = `${process.env.BASE_URL || ''}/`.replace(/\/+/g, '/');

const externalDependencies = [...Object.keys(packageInfo.dependencies || {})];

// Global constants injected by Vite's define
const define: Record<string, string> = {
    __BASE_URL__: JSON.stringify(baseUrl)
};

// Common esbuild options
const esbuild: ESBuildOptions = {
    legalComments: 'inline'
};

// Project aliases
const alias: AliasOptions = {
    src: resolve(__dirname, 'src/'),
    tests: resolve(__dirname, 'tests/'),
    root: resolve(__dirname)
};

// Library build config
export const libConfig: ViteUserConfig = {
    define,
    build: {
        outDir: resolve(__dirname, 'dist'),
        emptyOutDir: true,
        copyPublicDir: false,
        sourcemap: true,
        minify: 'esbuild',
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            name: packageInfo.name,
            fileName: format => `index.${format}.js`
        },
        rollupOptions: {
            plugins: [terser()],
            external: (id: string) => externalDependencies.some(dep => id.startsWith(dep)),
            output: {
                compact: true
            }
        }
    },
    esbuild,

    resolve: {
        alias
    },
    test: {
        expect: { requireAssertions: true },
        setupFiles: ['tests/setup/setup-tests.ts'],
        include: ['tests/**/*.{test,spec}.{js,ts}'],
        exclude: ['src/**/*.{js,ts}'],
        coverage: {
            provider: 'v8',
            reportsDirectory: '.coverage',
            reporter: ['text', 'html', 'clover'],
            include: ['src/**/*.{js,ts}'],
            exclude: ['*.config.*', '*.d.ts', 'src/main.ts'],
            thresholds: {
                statements: 80,
                functions: 80,
                lines: 80,
                branches: 80
            }
        }
    }
};

export default defineConfig(libConfig);
