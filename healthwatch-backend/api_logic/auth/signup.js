// api/auth/signup.js  — POST /api/auth/signup

import pool from "../../src/lib/mysql.js";
import { signToken } from "../../src/middleware/auth.js";
import { withCors } from "../../src/middleware/cors.js";
import { randomUUID } from "crypto";
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
    const [portalRows] = await pool.execute(`SELECT isUnlocked FROM StatePortal WHERE state = ? LIMIT 1`, [state]);
    if (portalRows.length === 0 || !portalRows[0].isUnlocked)
      return res.status(403).json({ error: "Portal is not active for this state" });

    // Check email unique
    const [existing] = await pool.execute(`SELECT id FROM User WHERE email = ? LIMIT 1`, [email]);
    if (existing.length > 0) return res.status(409).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("[Signup] Payload received for:", email, "Role:", role);

    const newId = randomUUID();
    const now = new Date();
    const dobDate = dob && !isNaN(new Date(dob)) ? new Date(dob) : null;

    let columns = ["id", "name", "email", "password", "role", "state", "district", "profileComplete", "isActive", "createdAt", "updatedAt"];
    let values = [newId, name, email, hashedPassword, role, state, district, 1, 1, now, now];

    if (phone) { columns.push("phone"); values.push(phone); }
    if (area) { columns.push("area"); values.push(area); }
    if (hospitalId) { columns.push("hospitalId"); values.push(hospitalId); }
    if (dobDate) { columns.push("dob"); values.push(dobDate); }
    if (gender) { columns.push("gender"); values.push(gender); }
    if (bloodGroup) { columns.push("bloodGroup"); values.push(bloodGroup); }
    if (familyMale) { columns.push("familyMale"); values.push(+familyMale); }
    if (familyFemale) { columns.push("familyFemale"); values.push(+familyFemale); }
    if (regularCondition) { columns.push("regularCondition"); values.push(regularCondition); }
    if (photo) { columns.push("photo"); values.push(photo); }

    const placeholders = values.map(() => "?").join(", ");
    await pool.execute(`INSERT INTO User (${columns.join(", ")}) VALUES (${placeholders})`, values);

    const token = signToken({ id: newId, role, state, hospitalId });
    return res.status(201).json({
      token,
      user: {
        id: newId, name, email, role,
        state, district, area,
        profileComplete: true, photo,
        dob: dobDate, familyMale, familyFemale,
        regularCondition, hospitalId
      },
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Email already registered" });
    console.error("[Signup] Server Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

export default withCors(handler);
