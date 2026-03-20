// api/portals/index.js
// GET   /api/portals           — list all portals (public, for signup check)
// PATCH /api/portals/:state    — lock or unlock a portal (minister only)

import { prisma } from "../../src/lib/prisma.js";
import { requireRole } from "../../src/middleware/auth.js";
import { withCors } from "../../src/middleware/cors.js";
import pool from "../../src/lib/mysql.js";
import { randomUUID } from "crypto";

async function handler(req, res) {
  if (req.method === "GET") {
    // Use direct mysql query to bypass Prisma client issues.
    const [activeMinisters] = await pool.execute(`
      SELECT 
        hm.state,
        sp.isUnlocked
      FROM HealthMinister hm
      LEFT JOIN StatePortal sp ON hm.state = sp.state
      WHERE hm.isActive = 1
    `);
    
    // Return as map { state: boolean }
    const map = {};
    activeMinisters.forEach(m => {
      // Raw query returns result as array of objects { state: string, isUnlocked: number|boolean }
      map[m.state] = !!m.isUnlocked;
    });
    return res.json(map);
  }

  if (req.method === "PATCH") {
    const auth = requireRole(req, "minister", "superadmin");
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    const { state, unlock } = req.body || {};
    const targetState = auth.user.role === "minister" ? auth.user.state : state;
    if (!targetState) return res.status(400).json({ error: "state is required" });

    const id = randomUUID();
    const isUnlockedVal = unlock ? 1 : 0;
    const now = new Date();
    
    const unlockedAtParam = unlock ? now : null;
    const lockedAtParam = !unlock ? now : null;

    await pool.execute(`
      INSERT INTO StatePortal (id, state, isUnlocked, unlockedAt, lockedAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        isUnlocked = VALUES(isUnlocked),
        unlockedAt = VALUES(unlockedAt),
        lockedAt = VALUES(lockedAt),
        updatedAt = VALUES(updatedAt)
    `, [id, targetState, isUnlockedVal, unlockedAtParam, lockedAtParam, now]);

    return res.json({ state: targetState, isUnlocked: !!unlock });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withCors(handler);
