// api_logic/debug.js
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { withCors } from "../src/middleware/cors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function handler(req, res) {
  try {
    const loginFilePath = join(__dirname, 'auth', 'login.js');
    const loginContent = fs.readFileSync(loginFilePath, 'utf8');
    res.json({ loginContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default withCors(handler);
