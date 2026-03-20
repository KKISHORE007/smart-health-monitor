// api/symptoms/index.js
// GET  /api/symptoms   — list (doctor/helper: their hospital; patient: their own)
// POST /api/symptoms   — submit new report (patient)

import { prisma } from "../../src/lib/prisma.js";
import { requireAuth } from "../../src/middleware/auth.js";
import { withCors } from "../../src/middleware/cors.js";
import { detectDisease, checkOutbreakAlert } from "../../src/lib/diseaseDetection.js";

async function handler(req, res) {
  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  const { user } = auth;

  // ── GET: list reports ─────────────────────────────────────────────────────
  if (req.method === "GET") {
    let where = {};

    if (user.role === "patient") {
      where = { patientId: user.id };
    } else if (user.role === "doctor" || user.role === "helper") {
      where = { hospitalId: user.hospitalId };
    } else if (user.role === "minister") {
      where = { state: user.state?.trim() };
    }
    // superadmin: no filter (all)

    const reports = await prisma.symptomReport.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, dob: true, gender: true, district: true, area: true, familyMale: true, familyFemale: true } },
        hospital: { select: { id: true, name: true, district: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    return res.json(reports);
  }

  // ── POST: submit report ────────────────────────────────────────────────────
  if (req.method === "POST") {
    if (user.role !== "patient")
      return res.status(403).json({ error: "Only patients can submit symptom reports" });

    const { hospitalId, state, district, area, symptoms } = req.body || {};
    if (!hospitalId || !symptoms?.length)
      return res.status(400).json({ error: "hospitalId and symptoms are required" });

    try {
      const detectedDisease = detectDisease(symptoms);

      // Create the symptom report
      const report = await prisma.symptomReport.create({
        data: {
          patientId: user.id,
          hospitalId,
          state,
          district,
          area,
          symptoms,
          detectedDisease,
        },
      });

      // Check for outbreak
      if (detectedDisease) {
        const outbreak = await checkOutbreakAlert(prisma, district);
        if (outbreak) {
          await prisma.symptomReport.update({
            where: { id: report.id },
            data: { alertSent: true },
          });

          // Upsert outbreak alert
          const existing = await prisma.outbreakAlert.findFirst({
            where: {
              district: district,
              disease: outbreak.disease,
              isActive: true,
            },
          });

          if (existing) {
            await prisma.outbreakAlert.update({
              where: { id: existing.id },
              data: { patientCount: outbreak.count },
            });
            // Add new entry if not already there
            await prisma.outbreakAlertEntry.upsert({
              where: { alertId_symptomReportId: { alertId: existing.id, symptomReportId: report.id } },
              create: { alertId: existing.id, symptomReportId: report.id },
              update: {},
            });
          } else {
            const alert = await prisma.outbreakAlert.create({
              data: {
                disease: outbreak.disease,
                hospitalId,
                district,
                area,
                state,
                patientCount: outbreak.count,
              },
            });
            // Link all contributing reports
            await prisma.outbreakAlertEntry.createMany({
              data: [...outbreak.reportIds, report.id].map(rid => ({
                alertId: alert.id,
                symptomReportId: rid,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      return res.status(201).json({ ...report, detectedDisease });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  // ── PATCH: resolve report ──────────────────────────────────────────────────
  if (req.method === "PATCH") {
    const { id: queryId } = req.query || {};
    const { id: bodyId, isResolved } = req.body || {};
    const id = queryId || bodyId;
    
    if (!id) return res.status(400).json({ error: "Symptom report ID is required" });
    
    try {
      const updated = await prisma.symptomReport.update({
        where: { id },
        data: { isResolved: !!isResolved }
      });

      // If resolved, check if this triggers auto-resolution of OutbreakAlerts
      if (isResolved) {
        // Find alerts containing this report
        const alertEntries = await prisma.outbreakAlertEntry.findMany({
          where: { symptomReportId: id },
          include: { 
            alert: { 
              include: { 
                entries: { 
                  include: { symptomReport: true } 
                } 
              } 
            } 
          }
        });

        for (const entry of alertEntries) {
          const alert = entry.alert;
          // An alert is auto-coordinated resolved if ALL its symptoms are resolved
          const allResolved = alert.entries.every(e => e.symptomReport.isResolved);
          if (allResolved) {
            await prisma.outbreakAlert.update({
              where: { id: alert.id },
              data: { isResolved: true, isActive: false }
            });
          }
        }
      }

      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(405).json({ 
    error: `Method ${req.method} not allowed on symptoms endpoint`,
    reqMethod: req.method,
    reqUrl: req.url
  });
}

export default withCors(handler);
