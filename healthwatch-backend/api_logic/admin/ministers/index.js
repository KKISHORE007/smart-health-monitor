// api/admin/ministers/index.js
// GET    /api/admin/ministers          — list all ministers (superadmin)
// POST   /api/admin/ministers          — create new minister (superadmin)
// PATCH  /api/admin/ministers/:id      — update credentials (superadmin)
// DELETE /api/admin/ministers/:id      — revoke (superadmin)

import { prisma } from "../../../src/lib/prisma.js";
import { requireRole } from "../../../src/middleware/auth.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const auth = requireRole(req, "superadmin");
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === "GET") {
    const ministers = await prisma.healthMinister.findMany({
      orderBy: { state: "asc" },
      select: { id: true, name: true, title: true, state: true, isActive: true, createdAt: true },
    });
    return res.json(ministers);
  }

  if (req.method === "POST") {
    const { id, name, title, state, password } = req.body || {};
    if (!id || !name || !state || !password)
      return res.status(400).json({ error: "id, name, state and password are required" });

    const hashed = await bcrypt.hash(password, 12);
    try {
      const minister = await prisma.healthMinister.create({
        data: { id, name, title: title || `Health Minister, ${state}`, state, password: hashed },
      });
      // Create portal entry for the state
      await prisma.statePortal.upsert({
        where: { state },
        create: { state, isUnlocked: false },
        update: {},
      });
      return res.status(201).json({ id: minister.id, name: minister.name, state: minister.state });
    } catch (err) {
      if (err.code === "P2002") return res.status(409).json({ error: "Minister ID or state already exists" });
      throw err;
    }
  }

  if (req.method === "DELETE") {
    const { ids } = req.body || {};
    if (!ids || !Array.isArray(ids))
      return res.status(400).json({ error: "ids array is required" });

    try {
      // Get states before deleting to lock portals
      const ministers = await prisma.healthMinister.findMany({
        where: { id: { in: ids } },
        select: { state: true }
      });

      if (ministers.length === 0) {
        return res.json({ success: true, count: 0, message: "No matching ministers found." });
      }

      // Update all to inactive
      await prisma.healthMinister.updateMany({
        where: { id: { in: ids } },
        data: { isActive: false }
      });

      // Lock all portals
      const states = ministers.map(m => m.state).filter(Boolean);
      if (states.length > 0) {
        try {
          await prisma.statePortal.updateMany({
            where: { state: { in: states } },
            data: { isUnlocked: false, lockedAt: new Date() }
          });
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
