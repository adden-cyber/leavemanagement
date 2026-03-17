const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const email = 'hr@example.com';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
        },
        create: {
            email,
            password: hashedPassword,
            role: 'ADMIN',
            employee: {
                create: {
                    fullName: 'Admin',
                    position: 'HR Manager',
                    department: 'Human Resources',
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
