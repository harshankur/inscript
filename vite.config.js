import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const PORT = env.SERVER_PORT || 3001;
    const CLIENT_PORT = env.CLIENT_PORT || 5173;

    return {
        envPrefix: ['VITE_', 'TITLE', 'SITE_URL', 'CONTENT_DIR', 'STATIC_DIR', 'FAVICON', 'DRAFTS_DIR', 'DIST_DIR', 'SERVER_PORT', 'CLIENT_PORT', 'ALLOW_PUSH', 'ALLOWED_HOSTS'],
        plugins: [react()],
        server: {
            port: parseInt(CLIENT_PORT),
            strictPort: true, // Don't try next port if occupied, fail instead (predictability)
            proxy: {
                '/api': `http://localhost:${PORT}`,
                '/images': `http://localhost:${PORT}`,
                // Proxy image formats that might be in the static root, but EXCLUDE favicon.png (served by Vite)
                '^/(?!favicon\\.png).*\\.(png|jpg|jpeg|gif|svg|webp|ico)$': `http://localhost:${PORT}`
            },
            allowedHosts: env.ALLOWED_HOSTS ? env.ALLOWED_HOSTS.split(',') : undefined
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
