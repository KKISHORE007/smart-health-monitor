// api/admin/ministers/[id].js
// PATCH  /api/admin/ministers/:id  — update name/title/password
// DELETE /api/admin/ministers/:id  — revoke (set isActive = false)

import { prisma } from "../../../src/lib/prisma.js";
import { requireRole } from "../../../src/middleware/auth.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const auth = requireRole(req, "superadmin");
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  const { id } = req.query;

  if (req.method === "PATCH") {
    const { id: newId, name, title, password } = req.body || {};
    const data = { isActive: true }; // Reactivate if it was revoked
    if (newId) data.id = newId.trim();
    if (name) data.name = name.trim();
    if (title) data.title = title.trim();
    if (password) data.password = await bcrypt.hash(password, 12);

    try {
      const updated = await prisma.healthMinister.update({ where: { id }, data });
      console.log(`[Backend] Updated minister ${id} -> ${updated.id}`);
      return res.json({ id: updated.id, name: updated.name, state: updated.state });
    } catch (err) {
      console.error("[Backend] Update error:", err);
      return res.status(500).json({ error: "Could not update credentials. Check if the new ID is taken." });
    }
  }

  if (req.method === "DELETE") {
    try {
      const minister = await prisma.healthMinister.update({
        where: { id },
        data: { isActive: false },
      });
      // Also lock the portal for this state
      if (minister.state) {
        try {
          await prisma.statePortal.update({
            where: { state: minister.state },
            data: { isUnlocked: false, lockedAt: new Date() }
          });
        } catch (err) {
          // If portal doesn't exist, ignore (P2025)
          console.log(`[Backend] Portal for ${minister.state} not found, skipping lock.`);
        }
      }
      return res.json({ success: true });
    } catch (err) {
      if (err.code === "P2025") {
        console.log(`[Backend] Minister ${id} not found, already revoked or deleted.`);
        return res.json({ success: true, message: "Minister already revoked." });
      }
      console.error("[Backend] Revoke error:", err);
      return res.status(500).json({ error: "Failed to revoke credentials." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
