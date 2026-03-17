const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'hr@example.com' }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('Found user:');
    console.log('  email:', user.email);
    console.log('  role:', user.role);
    console.log('  password hash:', user.password);
    console.log('  password hash length:', user.password.length);

    // Test bcrypt comparison
    const testPassword = '123456';
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log('\nTesting bcrypt.compare with "123456":');
    console.log('  isValid:', isValid);

    // Also try hashing and comparing
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('\nNew hash:', newHash);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
