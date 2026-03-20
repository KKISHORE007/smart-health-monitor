import { prisma } from "./src/lib/prisma.js";
import fs from "fs";

async function main() {
  const ts = Date.now();
  const district = "V-DIST-" + ts;
  const state = "V-STATE-" + ts;
  const disease = "Cholera";
  const symptoms = ["Severe watery diarrhea", "Vomiting", "Rapid dehydration", "Muscle cramps"];
  const BASE_URL = "http://localhost:3000/api";

  console.log("Setting up test data for district:", district);
  
  await prisma.healthMinister.create({
      data: { id: "HM-V-" + ts, name: "V", title: "M", state, password: "p" }
  });
  await prisma.statePortal.create({ data: { state, isUnlocked: true } });
  
  const h1 = "H1-" + ts;
  const h2 = "H2-" + ts;
  await prisma.hospital.createMany({
    data: [
      { id: h1, name: "H1", district, state },
      { id: h2, name: "H2", district, state },
    ]
  });

  async function sub(email, hId) {
      const s = await fetch(`${BASE_URL}/auth/signup`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "V", email, password: "p", role: "patient", state, district, hospitalId: hId })
      });
      const { token } = await s.json();
      await fetch(`${BASE_URL}/symptoms`, {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ hospitalId: hId, state, district, symptoms })
      });
  }

  await sub(`v1-${ts}@t.com`, h1);
  await sub(`v2-${ts}@t.com`, h1);
  await sub(`v3-${ts}@t.com`, h2);

  const reports = await prisma.symptomReport.findMany({ where: { district } });
  console.log("Reports created in district:", reports.length);
  reports.forEach(r => console.log(` - ${r.id}: Disease=${r.detectedDisease}, Hosp=${r.hospitalId}`));

  const alert = await prisma.outbreakAlert.findFirst({
      where: { district, disease, isActive: true },
      include: { entries: true }
  });

  const result = {
      success: !!(alert && alert.patientCount === 3 && alert.entries.length === 3),
      alert
  };

  fs.writeFileSync("C:/KISHORE/COMPLETED PROJECT/health_watch_app/healthwatch-app/healthwatch-backend/verification_result.json", JSON.stringify(result, null, 2));
  console.log("Verification result saved to verification_result.json");
}

main().catch(e => {
    fs.writeFileSync("C:/KISHORE/COMPLETED PROJECT/health_watch_app/healthwatch-app/healthwatch-backend/verification_result.json", JSON.stringify({ error: e.stack }, null, 2));
    process.exit(1);
}).finally(() => prisma.$disconnect());
