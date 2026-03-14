import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function claudeDevProxy() {
  return {
    name: 'claude-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/claude', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return; }
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
          try {
            const { prompt, maxTokens = 300, temperature = 0.3 } = JSON.parse(body);
            const key = process.env.VITE_ANTHROPIC_KEY;
            if (!key) { res.statusCode = 500; res.end(JSON.stringify({ error: 'No ANTHROPIC key' })); return; }
            const r = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
              body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, temperature, messages: [{ role: 'user', content: prompt }] })
            });
            const data = await r.json();
            res.setHeader('Content-Type', 'application/json');
            if (!r.ok) { res.statusCode = r.status; res.end(JSON.stringify({ error: data.error?.message || 'API error' })); return; }
            res.end(JSON.stringify({ text: data.content?.[0]?.text || null }));
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
        });
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), claudeDevProxy()],
})
