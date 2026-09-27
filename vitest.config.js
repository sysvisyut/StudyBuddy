import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        globals: false,
    },
    resolve: {
        alias: {
            // Matches tsconfig.json "paths": { "@/*": ["./*"] }
            '@': path.resolve(__dirname, '.'),
        },
    },
});
