const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const usernamesToDelete = ['admin.lms'];
    for (const username of usernamesToDelete) {
        try {
            const deletedUser = await prisma.user.delete({
                where: { username },
            });
            console.log(`Deleted user: ${deletedUser.username}`);
        } catch (e) {
            console.log(`Could not delete ${username}: ${e.message}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
