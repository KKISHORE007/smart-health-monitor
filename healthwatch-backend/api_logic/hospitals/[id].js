// api/hospitals/[id].js
// PATCH  /api/hospitals/:id   — toggle active (minister)
// DELETE /api/hospitals/:id   — remove (minister)

import { prisma } from "../../src/lib/prisma.js";
import { requireRole } from "../../src/middleware/auth.js";

export default async function handler(req, res) {
  const auth = requireRole(req, "minister", "superadmin");
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  const { id } = req.query;

  if (req.method === "PATCH") {
    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) return res.status(404).json({ error: "Hospital not found" });

    const updated = await prisma.hospital.update({
      where: { id },
      data: { isActive: !hospital.isActive },
    });
    return res.json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.hospital.delete({ where: { id } });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
