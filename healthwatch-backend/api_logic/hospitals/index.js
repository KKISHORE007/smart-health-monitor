// api/hospitals/index.js
// GET  /api/hospitals          — list (filtered by state query param)
// POST /api/hospitals          — create (minister only)

import { prisma } from "../../src/lib/prisma.js";
import { requireRole } from "../../src/middleware/auth.js";
import { withCors } from "../../src/middleware/cors.js";

async function handler(req, res) {
  if (req.method === "GET") {
    const { state } = req.query;
    const hospitals = await prisma.hospital.findMany({
      where: { ...(state ? { state } : {}), isActive: true },
      orderBy: { name: "asc" },
    });
    return res.json(hospitals);
  }

  if (req.method === "POST") {
    const auth = requireRole(req, "minister", "superadmin");
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    const { id, name, district, state, area } = req.body || {};
    if (!id || !name || !district || !state)
      return res.status(400).json({ error: "Missing fields: id, name, district, state" });

    try {
      const hospital = await prisma.hospital.create({
        data: { id, name, district, state, area, isActive: true },
      });
      return res.status(201).json(hospital);
    } catch (err) {
      if (err.code === "P2002") return res.status(409).json({ error: "Hospital ID already exists" });
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withCors(handler);
