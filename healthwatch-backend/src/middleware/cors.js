// src/middleware/cors.js
// Adds CORS headers and handles OPTIONS preflight for all API routes

export function withCors(handler) {
  return async (req, res) => {
    // Set CORS headers on every response
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle OPTIONS preflight — browsers send this before POST/PATCH/DELETE
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    return handler(req, res);
  };
}
