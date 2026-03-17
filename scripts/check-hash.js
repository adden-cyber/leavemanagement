const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
(async () => {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email: 'employee@example.com' } });
    console.log('user password hash:', user.password);
    console.log('compare 123456', await bcrypt.compare('123456', user.password));
    console.log('compare wrong', await bcrypt.compare('wrong', user.password));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();