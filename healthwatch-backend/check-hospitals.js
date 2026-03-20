import { prisma } from "./src/lib/prisma.js";

async function main() {
  const hospitals = await prisma.hospital.findMany();
  console.log("HOSPITALS_START");
  console.log(JSON.stringify(hospitals, null, 2));
  console.log("HOSPITALS_END");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
