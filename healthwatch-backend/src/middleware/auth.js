// src/middleware/auth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Vercel serverless helper — extracts + verifies Bearer token from request
export function requireAuth(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { error: "Unauthorized", status: 401 };
  const decoded = verifyToken(token);
  if (!decoded) return { error: "Invalid or expired token", status: 401 };
  return { user: decoded };
}

// Role guard
export function requireRole(req, ...roles) {
  const result = requireAuth(req);
  if (result.error) return result;
  if (!roles.includes(result.user.role)) {
    return { error: "Forbidden", status: 403 };
  }
  return result;
}
