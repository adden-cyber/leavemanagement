const { PrismaClient } = require('@prisma/client');
(async () => {
    const prisma = new PrismaClient();
    const cols = await prisma.$queryRaw`PRAGMA table_info('Goal');`;
    console.log(cols);
    await prisma.$disconnect();
})();
