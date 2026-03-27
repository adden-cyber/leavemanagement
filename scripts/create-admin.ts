import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("DATABASE_URL is not defined in .env");
    process.exit(1);
}

const { prisma } = require('../src/lib/prisma');

async function main() {
    console.log(`Connecting to database at ${url}...`);

    const username = 'admin.lms';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating/Updating user ${username}...`);

    try {
        const user = await prisma.user.upsert({
            where: { username },
            update: {
                name: 'Admin',
                password: hashedPassword,
                role: 'ADMIN',
            },
            create: {
                username,
                name: 'Admin',
                password: hashedPassword,
                role: 'ADMIN',
                employee: {
                    create: {
                        fullName: 'Admin',
                        position: 'HR Manager',
                        status: 'PERMANENT',
                        joinDate: new Date(),
                    }
                }
            },
        });

        console.log(`User ${user.username} created/updated with role ${user.role}`);

        // Ensure employee record exists if user was updated but didn't have one
        const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
        if (!employee) {
            console.log("Creating missing employee record...");
            await prisma.employee.create({
                data: {
                    userId: user.id,
                    fullName: 'Admin',
                    position: 'HR Manager',
                    status: 'PERMANENT',
                    joinDate: new Date(),
                }
            });
            console.log("Employee record created.");
        }

    } catch (e) {
        console.error("Error during upsert:", e);
        throw e;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
