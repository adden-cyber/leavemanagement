const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const a = await prisma.activity.create({
      data: {
        userName: 'Tester',
        action: 'Manual test activity',
        metadata: { test: 1 },
      },
    });
    console.log('created', a.id);

    const res = await fetch('http://localhost:3002/api/activities');
    console.log('GET /api/activities status', res.status);
    const body = await res.json();
    console.log('activities length', Array.isArray(body) ? body.length : 'not-array');
    console.log(body);
  } catch (e) {
    console.error('ERR', e);
  } finally {
    await prisma.$disconnect();
  }
})();
