const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const emailsToDelete = ['admin@hrsystem.com', 'admin@songyinroro.com'];
    for (const email of emailsToDelete) {
        try {
            const deletedUser = await prisma.user.delete({
                where: { email },
            });
            console.log(`Deleted user: ${deletedUser.email}`);
        } catch (e) {
            console.log(`Could not delete ${email}: ${e.message}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
