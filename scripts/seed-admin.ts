const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@hr.com';
    const password = 'adminpassword';
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log('Admin user already exists');
        return;
    }

    const user = await prisma.user.create({
        data: {
            email,
            name: 'System Administrator',
            password: hashedPassword,
            role: 'ADMIN',
            employee: {
                create: {
                    fullName: 'System Administrator',
                    position: 'Admin',
                    status: 'PERMANENT',
                }
            }
        },
    });

    console.log('Admin user created with email:', user.email, 'and password:', password);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
