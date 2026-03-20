import { prisma } from "./src/lib/prisma.js";

async function main() {
  const ministers = await prisma.healthMinister.findMany({
    select: { id: true, name: true, state: true, isActive: true }
  });
  console.log("HEALTH_MINISTERS_START");
  console.log(JSON.stringify(ministers, null, 2));
  console.log("HEALTH_MINISTERS_END");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
