// api_logic/debug.js
import { withCors } from "../src/middleware/cors.js";

async function handler(req, res) {
  // ONLY return a partial masked URL for safety
  const dbUrl = process.env.DATABASE_URL || "MISSING";
  const maskedUrl = dbUrl.replace(/:([^@]+)@/, ":****@");
  res.json({ DATABASE_URL: maskedUrl });
}

export default withCors(handler);
