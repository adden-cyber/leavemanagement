import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const prisma = new PrismaClient({ adapter: adapter as any });

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('Total users in database:', users.length);
        console.log('Users:');
        users.forEach((u: any) => {
            console.log(`- Email: ${u.email}, Role: ${u.role}, Hash length: ${u.password.length}`);
        });
    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
