import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const PORT = env.SERVER_PORT;
    const CLIENT_PORT = env.CLIENT_PORT;

    return {
        envPrefix: ['VITE_', 'TITLE', 'SITE_URL', 'CONTENT_DIR', 'STATIC_DIR', 'FAVICON', 'DRAFTS_DIR', 'DIST_DIR', 'SERVER_PORT', 'CLIENT_PORT', 'ALLOW_PUSH', 'ALLOWED_HOSTS', 'AUTH_'],
        optimizeDeps: {
            include: [
                '@tiptap/core',
                '@tiptap/react',
                '@tiptap/starter-kit',
                '@tiptap/extension-image',
                '@tiptap/extension-underline',
                '@tiptap/extension-text-style',
                '@tiptap/extension-color',
                '@tiptap/extension-highlight',
                '@tiptap/extension-text-align',
                '@tiptap/extension-subscript',
                '@tiptap/extension-superscript',
                'lucide-react',
                'diff',
                'react-i18next',
                'i18next'
            ]
        },
        plugins: [react()],
        resolve: {
            alias: {
                react: path.resolve(__dirname, 'node_modules/react'),
                'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
            },
            // inscript-editor is linked via file: and carries its own copies of these
            // peer deps in its devDependencies for standalone builds. Without dedupe,
            // Vite resolves two physical copies (one per node_modules tree), bloating
            // the bundle and risking duplicate React/TipTap instances.
            dedupe: [
                'react', 'react-dom',
                '@tiptap/core', '@tiptap/pm', '@tiptap/react', '@tiptap/starter-kit',
                '@tiptap/extension-color', '@tiptap/extension-highlight', '@tiptap/extension-image',
                '@tiptap/extension-link', '@tiptap/extension-subscript', '@tiptap/extension-superscript',
                '@tiptap/extension-table', '@tiptap/extension-table-cell', '@tiptap/extension-table-header',
                '@tiptap/extension-table-row', '@tiptap/extension-text-align', '@tiptap/extension-text-style',
                '@tiptap/extension-underline',
                'lucide-react', 'diff', 'react-i18next', 'i18next',
            ],
        },
        server: {
            host: '0.0.0.0',
            port: parseInt(CLIENT_PORT),
            strictPort: true,
            proxy: {
                '/api': `http://localhost:${PORT}`,
                '/auth': `http://localhost:${PORT}`,
                '/images': `http://localhost:${PORT}`,
                // Proxy image formats that might be in the static root, but EXCLUDE favicon.png (served by Vite)
                '^/.*\\.(png|jpg|jpeg|gif|svg|webp|ico)$': `http://localhost:${PORT}`
            },
            hmr: {
                clientPort: parseInt(CLIENT_PORT),
            },
            allowedHosts: env.ALLOWED_HOSTS === 'true' ? true : (env.ALLOWED_HOSTS ? env.ALLOWED_HOSTS.split(',') : undefined)
        },
        build: {
            outDir: mode === 'demo' ? 'docs' : env.DIST_DIR,
            emptyOutDir: true,
            rollupOptions: {
                input: mode === 'demo'
                    ? {
                        index_page: path.resolve(__dirname, 'index.html'),
                        landing_page: path.resolve(__dirname, 'assets/landing_source.html')
                    }
                    : {
                        index: path.resolve(__dirname, 'index.html')
                    }
            }
        },
        base: mode === 'demo' ? './' : '/'
    }
})
