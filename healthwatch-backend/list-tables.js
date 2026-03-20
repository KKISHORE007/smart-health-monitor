import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function test() {
  try {
    const tables = await prisma.$queryRaw`SHOW TABLES`;
    console.log("Tables in DB:", JSON.stringify(tables, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Failed to list tables:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
