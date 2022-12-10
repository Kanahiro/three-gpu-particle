// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: './example',
    base: './',
    build: {
        rollupOptions: {
            input: {
                index: resolve('./example', 'index.html'),
                maplibre: resolve('./example', 'maplibre.html'),
            },
        },
    },
});
