// api/admin/ministers/index.js
// GET    /api/admin/ministers          — list all ministers (superadmin)
// POST   /api/admin/ministers          — create new minister (superadmin)
// PATCH  /api/admin/ministers/:id      — update credentials (superadmin)
// DELETE /api/admin/ministers/:id      — revoke (superadmin)

import pool from "../../../src/lib/mysql.js";
import { requireRole } from "../../../src/middleware/auth.js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  const auth = requireRole(req, "superadmin");
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === "GET") {
    const [ministers] = await pool.execute(`
      SELECT id, name, title, state, isActive, createdAt 
      FROM HealthMinister 
      ORDER BY state ASC
    `);
    return res.json(ministers);
  }

  if (req.method === "POST") {
    const { id, name, title, state, password } = req.body || {};
    if (!id || !name || !state || !password)
      return res.status(400).json({ error: "id, name, state and password are required" });

    const hashed = await bcrypt.hash(password, 12);
    try {
      const now = new Date();
      // Create minister
      await pool.execute(
        `INSERT INTO HealthMinister (id, name, title, state, password, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        [id, name, title || `Health Minister, ${state}`, state, hashed, now, now]
      );

      // Create portal entry for the state
      const portalId = randomUUID();
      await pool.execute(
        `INSERT INTO StatePortal (id, state, isUnlocked, updatedAt) 
         VALUES (?, ?, 0, ?) 
         ON DUPLICATE KEY UPDATE state=VALUES(state)`,
        [portalId, state, now]
      );
      return res.status(201).json({ id, name, state });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Minister ID or state already exists" });
      console.error(err);
      throw err;
    }
  }

  if (req.method === "DELETE") {
    const { ids } = req.body || {};
    if (!ids || !Array.isArray(ids))
      return res.status(400).json({ error: "ids array is required" });

    try {
      if (ids.length === 0) return res.json({ success: true, count: 0, message: "No matching ministers found." });
      
      const placeholders = ids.map(() => '?').join(',');
      const [ministers] = await pool.execute(`SELECT state FROM HealthMinister WHERE id IN (${placeholders})`, ids);
      
      if (ministers.length === 0) {
        return res.json({ success: true, count: 0, message: "No matching ministers found." });
      }

      await pool.execute(`UPDATE HealthMinister SET isActive = 0 WHERE id IN (${placeholders})`, ids);

      const states = ministers.map(m => m.state).filter(Boolean);
      if (states.length > 0) {
        const statePlaceholders = states.map(() => '?').join(',');
        const now = new Date();
        try {
          await pool.execute(
            `UPDATE StatePortal SET isUnlocked = 0, lockedAt = ?, updatedAt = ? WHERE state IN (${statePlaceholders})`,
            [now, now, ...states]
          );
        } catch (err) {
          console.log("[Backend] Bulk portal lock failed, skipping.");
        }
      }

      return res.json({ success: true, count: ids.length });
    } catch (err) {
      console.error("[Backend] Bulk revoke error:", err);
      return res.status(500).json({ error: "Failed to perform bulk revocation." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
