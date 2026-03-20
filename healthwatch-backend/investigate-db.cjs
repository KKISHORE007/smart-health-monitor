const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Custom .env loader
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) process.env[key.trim()] = vals.join('=').trim().replace(/^"(.*)"$/, '$1');
  });
}
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) process.env[key.trim()] = vals.join('=').trim().replace(/^"(.*)"$/, '$1');
  });
}

const prisma = new PrismaClient();

async function main() {
  console.log("Checking Symptoms and Patients...");
  const symptoms = await prisma.symptomReport.findMany({
    include: {
      patient: true
    }
  });

  console.log(`Total Symptoms: ${symptoms.length}`);
  symptoms.forEach((s, idx) => {
    console.log(`\nReport ${idx + 1}:`);
    console.log(`  ID: ${s.id}`);
    console.log(`  Patient ID: ${s.patientId}`);
    console.log(`  Patient Object Name: ${s.patient?.name}`);
    console.log(`  Area: ${s.area}`);
    console.log(`  District: ${s.district}`);
  });

  const users = await prisma.user.findMany({
    where: { role: 'patient' }
  });
  console.log(`\nTotal Patients in DB: ${users.length}`);
  users.forEach(u => {
    console.log(`  - ${u.id}: ${u.name} (${u.email})`);
  });

  await prisma.$disconnect();
}

main();
