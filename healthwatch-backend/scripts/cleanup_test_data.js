import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('--- Cleaning up Test Data ---');
  
  const testFilter = {
    OR: [
      { state: { contains: 'Test' } },
      { state: { contains: 'test' } },
      { state: { contains: 'VERIFY' } }
    ]
  };

  try {
    // 1. OutbreakAlertEntry (Junction)
    const entriesDeleted = await prisma.outbreakAlertEntry.deleteMany({
      where: {
        alert: testFilter
      }
    });
    console.log(`Deleted ${entriesDeleted.count} outbreak alert entries.`);

    // 2. OutbreakAlert
    const alertsDeleted = await prisma.outbreakAlert.deleteMany({
      where: testFilter
    });
    console.log(`Deleted ${alertsDeleted.count} outbreak alerts.`);

    // 3. ResolvedCase
    const resolvedDeleted = await prisma.resolvedCase.deleteMany({
      where: {
        doctor: testFilter
      }
    });
    console.log(`Deleted ${resolvedDeleted.count} resolved cases.`);

    // 4. SymptomReport
    const symptomsDeleted = await prisma.symptomReport.deleteMany({
      where: testFilter
    });
    console.log(`Deleted ${symptomsDeleted.count} symptom reports.`);

    // 5. User (Patients, Doctors, Helpers)
    const usersDeleted = await prisma.user.deleteMany({
      where: testFilter
    });
    console.log(`Deleted ${usersDeleted.count} users.`);

    // 6. Hospital
    const hospitalsDeleted = await prisma.hospital.deleteMany({
      where: testFilter
    });
    console.log(`Deleted ${hospitalsDeleted.count} hospitals.`);

    // 7. StatePortal
    const portalsDeleted = await prisma.statePortal.deleteMany({
      where: testFilter
    });
    console.log(`Deleted ${portalsDeleted.count} state portals.`);

    // 8. HealthMinister
    const ministersDeleted = await prisma.healthMinister.deleteMany({
      where: testFilter
    });
    console.log(`Deleted ${ministersDeleted.count} health ministers.`);

    console.log('--- Cleanup Complete ---');
  } catch (err) {
    console.error('Cleanup failed:', err);
  }
}

cleanup()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
