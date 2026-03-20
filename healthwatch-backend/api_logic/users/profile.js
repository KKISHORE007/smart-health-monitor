// api/users/profile.js
// GET   /api/users/profile      — get current user profile
// PATCH /api/users/profile      — update profile (patient completes setup)

import { prisma } from "../../src/lib/prisma.js";
import { requireAuth } from "../../src/middleware/auth.js";

export default async function handler(req, res) {
  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  const { user } = auth;

  if (req.method === "GET") {
    let dbUser = null;
    if (user.role === "superadmin") {
      dbUser = await prisma.superAdmin.findUnique({ where: { id: user.id } });
      if (dbUser) dbUser.role = "superadmin";
    } else if (user.role === "minister") {
      dbUser = await prisma.healthMinister.findUnique({ where: { id: user.id } });
      if (dbUser) dbUser.role = "minister";
    } else {
      dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true, name: true, email: true, phone: true, role: true,
          state: true, district: true, area: true,
          dob: true, gender: true, bloodGroup: true,
          familyMale: true, familyFemale: true,
          profileComplete: true, photo: true,
          hospitalId: true,
          hospital: { select: { id: true, name: true, district: true } },
        },
      });
    }

    if (!dbUser) return res.status(404).json({ error: "User not found" });

    // Restrict access if portal is locked (except for admins/ministers)
    if (user.role !== "superadmin" && user.role !== "minister") {
      const portal = await prisma.statePortal.findUnique({ where: { state: dbUser.state } });
      if (!portal || !portal.isUnlocked) {
        return res.status(403).json({ error: "Portal is not active for this state" });
      }
    }

    return res.json(dbUser);
  }

  if (req.method === "PATCH") {
    const {
      name, phone, dob, gender, bloodGroup,
      familyMale, familyFemale, area, photo, profileComplete,
    } = req.body || {};

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(dob !== undefined && { dob: new Date(dob) }),
        ...(gender !== undefined && { gender }),
        ...(bloodGroup !== undefined && { bloodGroup }),
        ...(familyMale !== undefined && { familyMale: +familyMale }),
        ...(familyFemale !== undefined && { familyFemale: +familyFemale }),
        ...(area !== undefined && { area }),
        ...(photo !== undefined && { photo }),
        ...(profileComplete !== undefined && { profileComplete }),
      },
      select: {
        id: true, name: true, email: true, role: true, state: true,
        district: true, area: true, dob: true, gender: true, bloodGroup: true,
        familyMale: true, familyFemale: true, profileComplete: true, photo: true, hospitalId: true,
      },
    });
    return res.json(updated);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
