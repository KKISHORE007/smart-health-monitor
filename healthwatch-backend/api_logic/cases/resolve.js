// api/cases/resolve.js
// POST /api/cases/resolve — doctor marks a symptom report as resolved

import { prisma } from "../../src/lib/prisma.js";
import { requireRole } from "../../src/middleware/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const auth = requireRole(req, "doctor", "helper");
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  const { caseId, notes } = req.body || {};
  if (!caseId) return res.status(400).json({ error: "caseId is required" });

  try {
    const resolved = await prisma.resolvedCase.upsert({
      where: { caseId },
      create: { caseId, resolvedBy: auth.user.id, notes },
      update: { resolvedBy: auth.user.id, notes, resolvedAt: new Date() },
    });
    return res.json(resolved);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
