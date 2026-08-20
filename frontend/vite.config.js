import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        lib: {
            entry: 'src/index.jsx',
            formats: ['es'],
            entryFileNames: 'index.mjs',
            fileName: () => 'index.mjs',
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom', 'i18next', 'react-i18next', 'serverkit-sdk'],
        },
    },
});
