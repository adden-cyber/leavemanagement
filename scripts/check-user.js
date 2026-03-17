const { PrismaClient } = require('@prisma/client');

(async () => {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.findUnique({ where: { email: process.argv[2] || 'employee@example.com' } });
        console.log(user);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
})();