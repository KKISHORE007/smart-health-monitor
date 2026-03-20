// api/auth/login.js  — POST /api/auth/login
// Handles: patient, doctor, helper, health minister, super admin

import { prisma } from "../../src/lib/prisma.js";
import { signToken } from "../../src/middleware/auth.js";
import { withCors } from "../../src/middleware/cors.js";
import bcrypt from "bcryptjs";

async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { role: loginRole, id, password, email } = req.body || {};
  const normalizedRole = loginRole ? loginRole.toLowerCase() : "";

  try {
    // ── Super Admin ──────────────────────────────────────────
    if (normalizedRole === "superadmin") {
      const admin = await prisma.superAdmin.findFirst();
      if (!admin || !(await bcrypt.compare(password, admin.password)))
        return res.status(401).json({ error: "Invalid credentials" });
      const token = signToken({ id: admin.id, role: "SUPERADMIN" });
      return res.json({ token, role: "SUPERADMIN" });
    }

    // ── Health Minister ───────────────────────────────────────
    const trimmedId = id ? id.trim() : "";
    if (normalizedRole === "minister") {
      const minister = await prisma.healthMinister.findFirst({ where: { id: trimmedId } });
      if (!minister || !minister.isActive || !(await bcrypt.compare(password, minister.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = signToken({ id: minister.id, role: "MINISTER", state: minister.state, name: minister.name, title: minister.title });
      return res.json({ token, role: "MINISTER", minister: { id: minister.id, name: minister.name, title: minister.title, state: minister.state } });
    }

    // ── Patient / Doctor / Helper ─────────────────────────────
    if (!email) return res.status(400).json({ error: "Email required" });
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Invalid credentials" });

    // Check if portal is active for user's state
    const portal = await prisma.statePortal.findFirst({ where: { state: user.state } });
    if (!portal || !portal.isUnlocked) {
      return res.status(403).json({ error: "Portal is not active for this state" });
    }
    const token = signToken({ id: user.id, role: user.role, state: user.state, hospitalId: user.hospitalId });
    return res.json({
      token,
      role: user.role,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        state: user.state, district: user.district, hospitalId: user.hospitalId,
        profileComplete: user.profileComplete, photo: user.photo,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

export default withCors(handler);
