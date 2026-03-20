// api/admin/ministers/[id].js
// PATCH  /api/admin/ministers/:id  — update name/title/password
// DELETE /api/admin/ministers/:id  — revoke (set isActive = false)

import pool from "../../../src/lib/mysql.js";
import { requireRole } from "../../../src/middleware/auth.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const auth = requireRole(req, "superadmin");
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  const { id } = req.query;

  if (req.method === "PATCH") {
    const { id: newId, name, title, password } = req.body || {};
    
    // We update fields dynamically
    let updates = ["isActive = 1"];
    let values = [];
    
    if (newId) { updates.push("id = ?"); values.push(newId.trim()); }
    if (name) { updates.push("name = ?"); values.push(name.trim()); }
    if (title) { updates.push("title = ?"); values.push(title.trim()); }
    if (password) { updates.push("password = ?"); values.push(await bcrypt.hash(password, 12)); }
    
    values.push(id); // For the WHERE clause
    
    try {
      await pool.execute(`UPDATE HealthMinister SET ${updates.join(', ')} WHERE id = ?`, values);
      
      const queryId = newId ? newId.trim() : id;
      const [rows] = await pool.execute(`SELECT id, name, state FROM HealthMinister WHERE id = ?`, [queryId]);
      if (rows.length === 0) return res.status(404).json({ error: "Minister not found" });
      
      const updated = rows[0];
      console.log(`[Backend] Updated minister ${id} -> ${updated.id}`);
      return res.json({ id: updated.id, name: updated.name, state: updated.state });
    } catch (err) {
      console.error("[Backend] Update error:", err);
      return res.status(500).json({ error: "Could not update credentials. Check if the new ID is taken." });
    }
  }

  if (req.method === "DELETE") {
    try {
      const [ministers] = await pool.execute(`SELECT state FROM HealthMinister WHERE id = ?`, [id]);
      if (ministers.length === 0) {
        console.log(`[Backend] Minister ${id} not found.`);
        return res.json({ success: true, message: "Minister already revoked." });
      }
      const state = ministers[0].state;
      
      await pool.execute(`UPDATE HealthMinister SET isActive = 0 WHERE id = ?`, [id]);
      
      // Lock portal
      if (state) {
        try {
          const now = new Date();
          await pool.execute(
            `UPDATE StatePortal SET isUnlocked = 0, lockedAt = ?, updatedAt = ? WHERE state = ?`,
            [now, now, state]
          );
        } catch (err) {
          console.log(`[Backend] Portal for ${state} not found, skipping lock.`);
        }
      }
      return res.json({ success: true });
    } catch (err) {
      console.error("[Backend] Revoke error:", err);
      return res.status(500).json({ error: "Failed to revoke credentials." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
