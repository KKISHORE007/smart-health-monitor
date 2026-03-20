// src/lib/diseaseDetection.js
// Mirrors the frontend DISEASE_SYMPTOMS logic — runs server-side for integrity

const DISEASE_SYMPTOMS = {
  "Cholera":            ["Severe watery diarrhea","Vomiting","Rapid dehydration","Muscle cramps","Weakness","Low blood pressure"],
  "Typhoid Fever":      ["High fever","Headache","Stomach pain","Weakness","Loss of appetite","Diarrhea or constipation"],
  "Dysentery":          ["Bloody diarrhea","Abdominal cramps","Fever","Nausea","Vomiting"],
  "Hepatitis A":        ["Fatigue","Nausea","Vomiting","Abdominal pain","Dark urine","Yellow skin (Jaundice)"],
  "Acute Diarrheal Disease": ["Frequent loose stools","Dehydration","Weakness","Stomach cramps","Nausea"],
  "Giardiasis":         ["Diarrhea","Gas and bloating","Fatigue","Weight loss","Greasy stools"],
  "Leptospirosis":      ["Fever","Headache","Muscle pain","Vomiting","Red eyes","Abdominal pain"],
  "Campylobacteriosis": ["Diarrhea (sometimes bloody)","Fever","Abdominal pain","Nausea","Vomiting"],
  "E. coli Infection":  ["Severe stomach cramps","Diarrhea (sometimes bloody)","Vomiting","Mild fever"],
  "Cryptosporidiosis":  ["Watery diarrhea","Stomach cramps","Dehydration","Nausea","Fever"],
};

export function detectDisease(selectedSymptoms) {
  let best = null, bestScore = 0;
  for (const [disease, symptoms] of Object.entries(DISEASE_SYMPTOMS)) {
    const matches = selectedSymptoms.filter(s => symptoms.includes(s)).length;
    const score = matches / symptoms.length;
    if (score > bestScore && matches >= 2) { bestScore = score; best = disease; }
  }
  return best;
}

// Returns disease name if 3+ patients in same district share a disease
export async function checkOutbreakAlert(prisma, district) {
  const reports = await prisma.symptomReport.findMany({
    where: {
      district: district,
      detectedDisease: { not: null },
      isResolved: false,
    },
    select: { id: true, detectedDisease: true },
  });

  const byDisease = {};
  reports.forEach(r => {
    if (!byDisease[r.detectedDisease]) byDisease[r.detectedDisease] = [];
    byDisease[r.detectedDisease].push(r.id);
  });

  for (const [disease, ids] of Object.entries(byDisease)) {
    if (ids.length >= 3) return { disease, count: ids.length, reportIds: ids };
  }
  return null;
}
