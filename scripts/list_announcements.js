const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    console.log('count', rows.length);
    for (const r of rows) console.log(r.id, r.title, r.authorId, r.status, r.createdAt);
  } catch (e) {
    console.error('ERR', e);
  } finally {
    await prisma.$disconnect();
  }
})();
