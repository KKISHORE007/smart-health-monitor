// api/users/index.js
// GET /api/users - list users (state ministers sees their state, doctors see their hospital/state, superadmin sees all)

import { prisma } from "../../src/lib/prisma.js";
import { requireAuth } from "../../src/middleware/auth.js";
import { withCors } from "../../src/middleware/cors.js";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  const { user } = auth;

  // Roles that are allowed to list users
  const allowedRoles = ["doctor", "helper", "minister", "superadmin"];
  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    let where = {};

    if (user.role === "minister") {
      where = { state: user.state?.trim() };
    } else if (user.role === "doctor" || user.role === "helper") {
      where = { state: user.state?.trim() };
    }
    // Superadmin: no filter (returns all)

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        state: true,
        district: true,
        area: true,
        photo: true,
        dob: true,
        gender: true,
        familyMale: true,
        familyFemale: true,
        regularCondition: true,
        hospitalId: true,
        createdAt: true,
        profileComplete: true,
      },
      orderBy: { name: "asc" },
    });

    return res.json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    return res.status(500).json({ error: "Fetch users error", message: err.message });
  }
}

export default withCors(handler);
