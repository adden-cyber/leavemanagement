const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2] || 'employee@example.com';
    const password = process.argv[3] || '123456';
    const name = process.argv[4] || 'employee';

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            name: name,
            password: hashedPassword,
            role: 'EMPLOYEE',
        },
        create: {
            email,
            name: name,
            password: hashedPassword,
            role: 'EMPLOYEE',
            employee: {
                create: {
                    fullName: name,
                    position: 'TBD',
                    department: 'TBD',
                    joinDate: new Date(),
                }
            }
        },
    });

    console.log(`User ${user.email} created/updated with role ${user.role}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });