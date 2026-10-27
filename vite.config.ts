import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { handleShare } from './netlify/lib/share-handler'

/**
 * Serves /api/share during `vite dev` with the same handler the Netlify
 * Function uses, backed by memory instead of Netlify Blobs. Links made
 * locally stop working when the dev server restarts.
 */
function devShareApi(): Plugin {
  const entries = new Map<string, string>()
  return {
    name: 'date-deck-dev-share-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/share', async (req, res) => {
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const body = chunks.length ? Buffer.concat(chunks) : undefined
        const request = new Request(`http://localhost${req.originalUrl ?? req.url}`, {
          method: req.method,
          headers: { 'content-type': req.headers['content-type'] ?? 'application/json' },
          body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
        })
        const response = await handleShare(request, {
          get: async (id) => entries.get(id) ?? null,
          create: async (id, payload) => !entries.has(id) && !!entries.set(id, payload),
        })
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(await response.text())
      })
    },
  }
}

// Vite config — https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devShareApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Reachable from a phone on the same Wi-Fi for testing.
    host: true,
    port: parseInt(process.env.PORT || '8443'),
    strictPort: true,
  },
  preview: {
    host: true,
    port: parseInt(process.env.PORT || '8443'),
  },
})
