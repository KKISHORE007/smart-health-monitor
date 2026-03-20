import express from 'express';
import cors from 'cors';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manually load .env files
[join(__dirname, '.env'), join(__dirname, '.env.local')].forEach(path => {
  if (fs.existsSync(path)) {
    const content = fs.readFileSync(path, 'utf8');
    content.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) process.env[key] = value;
      }
    });
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// Helper to load Vercel handlers
async function loadHandler(path) {
  try {
    const module = await import(pathToFileURL(path).href + "?t=" + Date.now());
    return module.default;
  } catch (e) {
    console.error(`Error loading handler at ${path}:`, e);
    return null;
  }
}

// Routes mapping based on the api folder structure
const apiDir = join(__dirname, 'api_logic');

async function setupRoutes(dir, prefix = '/api') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await setupRoutes(fullPath, `${prefix}/${entry.name}`);
    } else if (entry.name.endsWith('.js')) {
      let routePath = entry.name === 'index.js' ? prefix : `${prefix}/${entry.name.replace('.js', '')}`;
      // Convert [param] to :param for Express
      routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');
      
      console.log(`Setting up route: ${routePath}`);
      app.all(routePath, async (req, res) => {
        // Hot reload: Load the latest version of the handler for every request
        const handler = await loadHandler(fullPath);
        if (!handler) {
          return res.status(500).json({ error: `Could not load handler for ${routePath}` });
        }

        if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
          console.log(`[API ${req.method}] ${routePath} Body:`, JSON.stringify(req.body, null, 2));
        }
        // Vercel merges route params into req.query
        const mergedQuery = { ...req.query, ...req.params };
        Object.defineProperty(req, 'query', {
          value: mergedQuery,
          enumerable: true,
          configurable: true,
          writable: true
        });
        try {
          if (req.headers.authorization) console.log(`[AUTH] Token: ${req.headers.authorization.substring(0, 30)}...`);
          
          await handler(req, res);
          
          if (res.statusCode >= 400) {
            console.error(`[ERR] ${res.statusCode} on ${routePath}`);
          } else {
            console.log(`[DONE] ${routePath}`);
          }
        } catch (error) {
          console.error(`[ERROR] Handler for ${routePath} failed:`, error);
          if (!res.headersSent) {
            res.status(500).send('Internal Server Error');
          }
        }
      });
    }
  }
}

await setupRoutes(apiDir);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
