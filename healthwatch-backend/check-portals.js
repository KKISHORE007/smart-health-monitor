import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const portals = await prisma.statePortal.findMany();
  console.log('Portal Statuses:');
  portals.forEach(p => {
    console.log(`${p.state}: ${p.isUnlocked ? 'UNLOCKED' : 'LOCKED'}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
