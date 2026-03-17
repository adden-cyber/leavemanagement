const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('Total users in database:', users.length);
        console.log('Users:');
        users.forEach(u => {
            console.log(`- Email: ${u.email}, Role: ${u.role}, Password Hash Length: ${u.password.length}`);
        });
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
