/**
 * RESET DATABASE SCRIPT (ES Module version)
 * Deletes all data from all tables in the correct order.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting full database reset...');

  try {
    // Order matters to avoid Foreign Key violations
    
    console.log('  - Clearing AuditLog...');
    await prisma.auditLog.deleteMany();

    console.log('  - Clearing ResolvedCase...');
    await prisma.resolvedCase.deleteMany();

    console.log('  - Clearing OutbreakAlertEntry...');
    await prisma.outbreakAlertEntry.deleteMany();

    console.log('  - Clearing OutbreakAlert...');
    await prisma.outbreakAlert.deleteMany();

    console.log('  - Clearing SymptomReport...');
    await prisma.symptomReport.deleteMany();

    console.log('  - Clearing User...');
    await prisma.user.deleteMany();

    console.log('  - Clearing Hospital...');
    await prisma.hospital.deleteMany();

    console.log('  - Clearing StatePortal...');
    await prisma.statePortal.deleteMany();

    console.log('  - Clearing HealthMinister...');
    await prisma.healthMinister.deleteMany();

    console.log('  - Clearing SuperAdmin...');
    await prisma.superAdmin.deleteMany();

    console.log('✅ Database reset complete. Everything is empty.');
  } catch (error) {
    console.error('❌ Error during database reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
