// api/users/profile.js
// GET   /api/users/profile      — get current user profile
// PATCH /api/users/profile      — update profile (patient completes setup)

import pool from "../../src/lib/mysql.js";
import { requireAuth } from "../../src/middleware/auth.js";

export default async function handler(req, res) {
  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  const { user } = auth;

  if (req.method === "GET") {
    let dbUser = null;
    if (user.role === "superadmin") {
      const [rows] = await pool.execute(`SELECT * FROM SuperAdmin WHERE id = ? LIMIT 1`, [user.id]);
      if (rows.length > 0) { dbUser = rows[0]; dbUser.role = "superadmin"; }
    } else if (user.role === "minister") {
      const [rows] = await pool.execute(`SELECT * FROM HealthMinister WHERE id = ? LIMIT 1`, [user.id]);
      if (rows.length > 0) { dbUser = rows[0]; dbUser.role = "minister"; }
    } else {
      const [rows] = await pool.execute(
        `SELECT id, name, email, phone, role, state, district, area, dob, gender, bloodGroup, familyMale, familyFemale, profileComplete, photo, hospitalId FROM User WHERE id = ? LIMIT 1`,
        [user.id]
      );
      if (rows.length > 0) {
        dbUser = rows[0];
        dbUser.profileComplete = !!dbUser.profileComplete;
        if (dbUser.hospitalId) {
          const [hospRows] = await pool.execute(`SELECT id, name, district FROM Hospital WHERE id = ? LIMIT 1`, [dbUser.hospitalId]);
          if (hospRows.length > 0) dbUser.hospital = hospRows[0];
        }
      }
    }

    if (!dbUser) return res.status(404).json({ error: "User not found" });

    // Restrict access if portal is locked (except for admins/ministers)
    if (user.role !== "superadmin" && user.role !== "minister") {
      const [portalRows] = await pool.execute(`SELECT * FROM StatePortal WHERE state = ? LIMIT 1`, [dbUser.state]);
      const portal = portalRows[0];
      if (!portal || !portal.isUnlocked) {
        return res.status(403).json({ error: "Portal is not active for this state" });
      }
    }

    return res.json(dbUser);
  }

  if (req.method === "PATCH") {
    if (user.role === "superadmin" || user.role === "minister") {
      return res.status(400).json({ error: "Admins cannot update profile here." });
    }

    const {
      name, phone, dob, gender, bloodGroup,
      familyMale, familyFemale, area, photo, profileComplete,
    } = req.body || {};

    let updates = [];
    let values = [];

    if (name !== undefined) { updates.push("name = ?"); values.push(name); }
    if (phone !== undefined) { updates.push("phone = ?"); values.push(phone); }
    if (dob !== undefined) { updates.push("dob = ?"); values.push(dob ? new Date(dob) : null); }
    if (gender !== undefined) { updates.push("gender = ?"); values.push(gender); }
    if (bloodGroup !== undefined) { updates.push("bloodGroup = ?"); values.push(bloodGroup); }
    if (familyMale !== undefined) { updates.push("familyMale = ?"); values.push(+familyMale); }
    if (familyFemale !== undefined) { updates.push("familyFemale = ?"); values.push(+familyFemale); }
    if (area !== undefined) { updates.push("area = ?"); values.push(area); }
    if (photo !== undefined) { updates.push("photo = ?"); values.push(photo); }
    if (profileComplete !== undefined) { updates.push("profileComplete = ?"); values.push(profileComplete ? 1 : 0); }

    if (updates.length > 0) {
      updates.push("updatedAt = ?");
      values.push(new Date());

      values.push(user.id);
      await pool.execute(`UPDATE User SET ${updates.join(", ")} WHERE id = ?`, values);
    }

    const [rows] = await pool.execute(
      `SELECT id, name, email, role, state, district, area, dob, gender, bloodGroup, familyMale, familyFemale, profileComplete, photo, hospitalId FROM User WHERE id = ? LIMIT 1`,
      [user.id]
    );

    let updatedUser = rows.length > 0 ? rows[0] : {};
    if ('profileComplete' in updatedUser) updatedUser.profileComplete = !!updatedUser.profileComplete;
    return res.json(updatedUser);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
