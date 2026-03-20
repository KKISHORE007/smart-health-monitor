// prisma/seed.js
// Run with: npm run db:seed
// Seeds Super Admin + all 36 Health Ministers (states + UTs)

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Super Admin ───────────────────────────────────────────────────────────────
const SUPER_ADMIN = {
  username: "SA-INDIA-2024",
  password: "india@healthwatch",
};

// ── All 36 Health Ministers (28 states + 8 UTs) ───────────────────────────────
const MINISTERS = [
  // States
  { id:"HM-TN-001", state:"Tamil Nadu",        name:"Ma. Subramanian",         title:"Health Minister, Tamil Nadu",          pass:"tn@health2024" },
  { id:"HM-MH-001", state:"Maharashtra",       name:"Tanaji Sawant",           title:"Health Minister, Maharashtra",         pass:"mh@health2024" },
  { id:"HM-KA-001", state:"Karnataka",         name:"Dinesh Gundu Rao",        title:"Health Minister, Karnataka",           pass:"ka@health2024" },
  { id:"HM-KL-001", state:"Kerala",            name:"Veena George",            title:"Health Minister, Kerala",              pass:"kl@health2024" },
  { id:"HM-AP-001", state:"Andhra Pradesh",    name:"Y. Satya Kumar",          title:"Health Minister, Andhra Pradesh",      pass:"ap@health2024" },
  { id:"HM-TG-001", state:"Telangana",         name:"Damodar Raja Narasimha",  title:"Health Minister, Telangana",           pass:"tg@health2024" },
  { id:"HM-GJ-001", state:"Gujarat",           name:"Rushikesh Patel",         title:"Health Minister, Gujarat",             pass:"gj@health2024" },
  { id:"HM-RJ-001", state:"Rajasthan",         name:"Gajendra Singh",          title:"Health Minister, Rajasthan",           pass:"rj@health2024" },
  { id:"HM-MP-001", state:"Madhya Pradesh",    name:"Vishvas Sarang",          title:"Health Minister, Madhya Pradesh",      pass:"mp@health2024" },
  { id:"HM-UP-001", state:"Uttar Pradesh",     name:"Brajesh Pathak",          title:"Health Minister, Uttar Pradesh",       pass:"up@health2024" },
  { id:"HM-WB-001", state:"West Bengal",       name:"Chandrima Bhattacharya",  title:"Health Minister, West Bengal",         pass:"wb@health2024" },
  { id:"HM-PB-001", state:"Punjab",            name:"Balbir Singh",            title:"Health Minister, Punjab",              pass:"pb@health2024" },
  { id:"HM-HR-001", state:"Haryana",           name:"Anil Vij",                title:"Health Minister, Haryana",             pass:"hr@health2024" },
  { id:"HM-BR-001", state:"Bihar",             name:"Mangal Pandey",           title:"Health Minister, Bihar",               pass:"br@health2024" },
  { id:"HM-AS-001", state:"Assam",             name:"Keshab Mahanta",          title:"Health Minister, Assam",               pass:"as@health2024" },
  { id:"HM-OR-001", state:"Odisha",            name:"Mukesh Mahaling",         title:"Health Minister, Odisha",              pass:"or@health2024" },
  { id:"HM-JH-001", state:"Jharkhand",         name:"Banna Gupta",             title:"Health Minister, Jharkhand",           pass:"jh@health2024" },
  { id:"HM-HP-001", state:"Himachal Pradesh",  name:"Dhani Ram Shandil",       title:"Health Minister, Himachal Pradesh",    pass:"hp@health2024" },
  { id:"HM-UK-001", state:"Uttarakhand",       name:"Dhan Singh Rawat",        title:"Health Minister, Uttarakhand",         pass:"uk@health2024" },
  { id:"HM-CG-001", state:"Chhattisgarh",      name:"Shyam Bihari Jaiswal",    title:"Health Minister, Chhattisgarh",        pass:"cg@health2024" },
  { id:"HM-GA-001", state:"Goa",               name:"Vishwajit Rane",          title:"Health Minister, Goa",                 pass:"ga@health2024" },
  { id:"HM-TR-001", state:"Tripura",           name:"Sushanta Chowdhury",      title:"Health Minister, Tripura",             pass:"tr@health2024" },
  { id:"HM-ML-001", state:"Meghalaya",         name:"Ampareen Lyngdoh",        title:"Health Minister, Meghalaya",           pass:"ml@health2024" },
  { id:"HM-MN-001", state:"Manipur",           name:"Sapam Ranjan Singh",      title:"Health Minister, Manipur",             pass:"mn@health2024" },
  { id:"HM-NL-001", state:"Nagaland",          name:"S. Pangyu Phom",          title:"Health Minister, Nagaland",            pass:"nl@health2024" },
  { id:"HM-AR-001", state:"Arunachal Pradesh", name:"Alo Libang",              title:"Health Minister, Arunachal Pradesh",   pass:"ar@health2024" },
  { id:"HM-MZ-001", state:"Mizoram",           name:"Dr. R. Lalthangliana",    title:"Health Minister, Mizoram",             pass:"mz@health2024" },
  { id:"HM-SK-001", state:"Sikkim",            name:"MK Sharma",               title:"Health Minister, Sikkim",              pass:"sk@health2024" },
  // Union Territories
  { id:"HM-JK-001", state:"Jammu & Kashmir",   name:"Sakeena Masood",          title:"Health Minister, Jammu & Kashmir",     pass:"jk@health2024" },
  { id:"HM-DL-001", state:"Delhi",             name:"Saurabh Bharadwaj",       title:"Health Minister, Delhi",               pass:"dl@health2024" },
  { id:"HM-PY-001", state:"Puducherry",        name:"Malladi Krishna Rao",     title:"Health Minister, Puducherry",          pass:"py@health2024" },
  { id:"HM-CH-001", state:"Chandigarh",        name:"Saurabh Bharadwaj",       title:"Health Minister, Chandigarh",          pass:"ch@health2024" },
  { id:"HM-AN-001", state:"Andaman & Nicobar Islands", name:"D.K. Joshi",     title:"Health Minister, Andaman & Nicobar",   pass:"an@health2024" },
  { id:"HM-DD-001", state:"Dadra & Nagar Haveli and Daman & Diu", name:"Praful Patel", title:"Health Minister, Dadra & NH / D&D", pass:"dd@health2024" },
  { id:"HM-LD-001", state:"Lakshadweep",       name:"Praful Patel",            title:"Health Minister, Lakshadweep",         pass:"ld@health2024" },
  { id:"HM-LA-001", state:"Ladakh",            name:"B.D. Mishra",             title:"Health Minister, Ladakh",              pass:"la@health2024" },
];

async function main() {
  console.log("🌱 Seeding HealthWatch database...\n");

  // ── Super Admin ──────────────────────────────────────────────────────────────
  const hashedAdmin = await bcrypt.hash(SUPER_ADMIN.password, 12);
  const existingSA = await prisma.superAdmin.findFirst();
  if (existingSA) {
    await prisma.superAdmin.update({
      where: { id: existingSA.id },
      data: { username: SUPER_ADMIN.username, password: hashedAdmin },
    });
    console.log("✅ Super Admin updated  (SA-INDIA-2024 / india@healthwatch)");
  } else {
    await prisma.superAdmin.create({
      data: { username: SUPER_ADMIN.username, password: hashedAdmin },
    });
    console.log("✅ Super Admin created  (SA-INDIA-2024 / india@healthwatch)");
  }

  // ── Health Ministers + State Portals ─────────────────────────────────────────
  console.log("\nSeeding Health Ministers...");
  for (const m of MINISTERS) {
    const hashed = await bcrypt.hash(m.pass, 12);
    await prisma.healthMinister.upsert({
      where: { id: m.id },
      create: { id: m.id, name: m.name, title: m.title, state: m.state, password: hashed, isActive: true },
      update: { name: m.name, title: m.title, password: hashed, isActive: true },
    });
    // Ensure a StatePortal row exists for every minister
    await prisma.statePortal.upsert({
      where: { state: m.state },
      create: { state: m.state, isUnlocked: false },
      update: {},
    });
    console.log(`  ✅ ${m.state.padEnd(40)} ${m.id}  /  ${m.pass}`);
  }

  console.log(`\n✅ Seed complete! ${MINISTERS.length} ministers + 1 Super Admin seeded.`);
  console.log("\nLogin credentials:");
  console.log("  Super Admin : SA-INDIA-2024       / india@healthwatch");
  console.log("  HM Example  : HM-TN-001           / tn@health2024");
}

main()
  .catch(e => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
