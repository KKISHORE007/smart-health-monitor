import { prisma } from "./src/lib/prisma.js";

async function test() {
  try {
    const portals = await prisma.statePortal.findMany({
      where: {
        minister: {
          isActive: true
        }
      },
      select: { state: true, isUnlocked: true },
    });
    console.log("Portals:", portals);
    process.exit(0);
  } catch (error) {
    console.error("Local test failed:", error);
    process.exit(1);
  }
}

test();
