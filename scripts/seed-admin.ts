const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const username = 'admin.lms';
    const password = 'adminpassword';
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
        where: { username },
    });

    if (existingUser) {
        console.log('Admin user already exists');
        return;
    }

    const user = await prisma.user.create({
        data: {
            username,
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

    console.log('Admin user created with username:', user.username, 'and password:', password);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
