import express from 'express';
import cors from 'cors';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Helper to load handlers
async function loadHandler(path) {
  try {
    const module = await import(pathToFileURL(path).href);
    return module.default;
  } catch (e) {
    console.error(`Error loading handler at ${path}:`, e);
    return null;
  }
}

// Routes mapping based on the api_logic folder structure
const apiLogicDir = join(__dirname, '..', 'api_logic');

async function setupRoutes(app, dir, prefix = '/api') {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await setupRoutes(app, fullPath, `${prefix}/${entry.name}`);
    } else if (entry.name.endsWith('.js')) {
      let routePath = entry.name === 'index.js' ? prefix : `${prefix}/${entry.name.replace('.js', '')}`;
      routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');
      
      app.all(routePath, async (req, res) => {
        const handler = await loadHandler(fullPath);
        if (!handler) {
          return res.status(500).json({ error: `Could not load handler for ${routePath}` });
        }
        try {
          // Vercel merges route params into req.query in standalone mode
          // We manually emulate this here
          const mergedQuery = { ...req.query, ...req.params };
          Object.defineProperty(req, 'query', {
            value: mergedQuery,
            enumerable: true,
            configurable: true,
            writable: true
          });
          await handler(req, res);
        } catch (error) {
          console.error(`Error in handler ${routePath}:`, error);
          if (!res.headersSent) res.status(500).send('Internal Server Error');
        }
      });
    }
  }
}

await setupRoutes(app, apiLogicDir);

// Catch-all for /api
app.get('/api', (req, res) => {
  res.json({ status: "✅ HealthWatch API is running (Consolidated)" });
});

export default app;
