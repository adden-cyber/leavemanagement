import { prisma } from '../src/lib/prisma';

async function clearAllUsers() {
  try {
    console.log('Deleting all users...');
    const result = await prisma.user.deleteMany({});
    console.log(`Deleted ${result.count} users`);
  } catch (e) {
    console.error('Error deleting users:', e);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllUsers();