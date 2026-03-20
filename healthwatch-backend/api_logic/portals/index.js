// api/portals/index.js
// GET   /api/portals           — list all portals (public, for signup check)
// PATCH /api/portals/:state    — lock or unlock a portal (minister only)

import { prisma } from "../../src/lib/prisma.js";
import { requireRole } from "../../src/middleware/auth.js";
import { withCors } from "../../src/middleware/cors.js";

async function handler(req, res) {
  if (req.method === "GET") {
    // Instead of filtering portals by minister (which has issues in production), 
    // we fetch active ministers and their state portals.
    const activeMinisters = await prisma.healthMinister.findMany({
      where: { isActive: true },
      include: { statePortal: true },
    });
    
    // Return as map { state: boolean }
    const map = { _v: "deploy_check_2026_03_20_v3" };
    activeMinisters.forEach(m => {
      map[m.state] = m.statePortal ? m.statePortal.isUnlocked : false;
    });
    return res.json(map);
  }

  if (req.method === "PATCH") {
    const auth = requireRole(req, "minister", "superadmin");
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    const { state, unlock } = req.body || {};
    const targetState = auth.user.role === "minister" ? auth.user.state : state;
    if (!targetState) return res.status(400).json({ error: "state is required" });

    const portal = await prisma.statePortal.upsert({
      where: { state: targetState },
      create: {
        state: targetState,
        isUnlocked: !!unlock,
        ...(unlock ? { unlockedAt: new Date() } : { lockedAt: new Date() }),
      },
      update: {
        isUnlocked: !!unlock,
        ...(unlock ? { unlockedAt: new Date() } : { lockedAt: new Date() }),
      },
    });
    return res.json(portal);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withCors(handler);
