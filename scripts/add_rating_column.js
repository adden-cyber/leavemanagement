const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('adding rating column if missing');
    await prisma.$executeRaw`ALTER TABLE Goal ADD COLUMN rating TEXT;`;
  } catch (e) {
    console.error('alter error', e.message);
  }
  const cols = await prisma.$queryRaw`PRAGMA table_info('Goal');`;
  console.log(cols);
  await prisma.$disconnect();
})();
