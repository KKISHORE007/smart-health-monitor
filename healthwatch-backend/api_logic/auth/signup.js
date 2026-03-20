// api/auth/signup.js  — POST /api/auth/signup

import { prisma } from "../../src/lib/prisma.js";
import { signToken } from "../../src/middleware/auth.js";
import { withCors } from "../../src/middleware/cors.js";
import bcrypt from "bcryptjs";

async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const {
    name, email, phone, password, role, state, district, area, hospitalId,
    dob, gender, bloodGroup, familyMale, familyFemale, regularCondition, photo
  } = req.body || {};

  if (!name || !email || !password || !role || !state || !district)
    return res.status(400).json({ error: "Missing required fields" });

  if (!["patient", "doctor", "helper"].includes(role))
    return res.status(400).json({ error: "Invalid role" });

  try {
    // Check portal is unlocked for this state
    const portal = await prisma.statePortal.findUnique({ where: { state } });
    if (!portal || !portal.isUnlocked)
      return res.status(403).json({ error: "Portal is not active for this state" });

    // Check email unique
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    console.log("[Signup] Payload:", JSON.stringify(req.body, null, 2));
    const user = await prisma.user.create({
      data: {
        name, email, phone, password: hashed, role, state, district, area,
        hospital: hospitalId ? { connect: { id: hospitalId } } : undefined,
        dob: dob && !isNaN(new Date(dob)) ? new Date(dob) : null,
        gender,
        bloodGroup,
        familyMale: familyMale ? +familyMale : 0,
        familyFemale: familyFemale ? +familyFemale : 0,
        regularCondition,
        photo,
        profileComplete: true,
      },
    });

    const token = signToken({ id: user.id, role: user.role, state: user.state, hospitalId: user.hospitalId });
    return res.status(201).json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        state: user.state, district: user.district, area: user.area,
        profileComplete: true, photo: user.photo,
        dob: user.dob, familyMale: user.familyMale, familyFemale: user.familyFemale,
        regularCondition: user.regularCondition, hospitalId: user.hospitalId
      },
    });
  } catch (err) {
    console.error("[Signup] Server Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

export default withCors(handler);
