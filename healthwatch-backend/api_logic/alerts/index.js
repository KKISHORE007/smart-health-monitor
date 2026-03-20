// api/alerts/index.js
// GET /api/alerts — list active outbreak alerts

import { prisma } from "../../src/lib/prisma.js";
import { requireAuth } from "../../src/middleware/auth.js";
import { withCors } from "../../src/middleware/cors.js";

async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PATCH")
    return res.status(405).json({ error: "Method not allowed" });

  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  const { user } = auth;

  let where = {};
  if (user.role === "doctor" || user.role === "helper") {
    where.hospitalId = user.hospitalId;
  } else if (user.role === "minister") {
    where = { state: user.state?.trim() };
  }

  if (req.method === "PATCH") {
    const { id, isViewedByAdmin } = req.body;
    if (!id) return res.status(400).json({ error: "Alert ID is required" });

    // Ensure only admins can mark viewed
    if (user.role !== "superadmin" && user.role !== "minister") {
      return res.status(403).json({ error: "Forbidden: Only admins can acknowledge alerts" });
    }

    const updated = await prisma.outbreakAlert.update({
      where: { id },
      data: { isViewedByAdmin: !!isViewedByAdmin }
    });
    return res.json(updated);
  }

  // ── Pre-flight Resolution Sync ──────────────────────────────────────────
  // Check active alerts: if all symptoms are resolved, mark the alert resolved.
  const activeAlerts = await prisma.outbreakAlert.findMany({
    where: { isActive: true },
    include: { entries: { include: { symptomReport: true } } }
  });

  for (const alert of activeAlerts) {
    if (alert.entries.length > 0) {
      const allResolved = alert.entries.every(e => e.symptomReport.isResolved);
      if (allResolved) {
        await prisma.outbreakAlert.update({
          where: { id: alert.id },
          data: { isResolved: true, isActive: false }
        });
      }
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const alerts = await prisma.outbreakAlert.findMany({
    where,
    include: {
      hospital: { select: { id: true, name: true } },
      entries: {
        include: {
          symptomReport: {
            include: {
              patient: { select: { id: true, name: true, dob: true, gender: true, familyMale: true, familyFemale: true } },
            },
          },
        },
      },
    },
    orderBy: { lastUpdated: "desc" },
  });

  return res.json(alerts);
}

export default withCors(handler);
