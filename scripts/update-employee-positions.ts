import { prisma } from '@/lib/prisma';

const positionMap: Record<string, string> = {
  'Test User': 'HR Coordinator',
  'Newstaff': 'Junior Developer',
  'System Administrator': 'System Admin',
  'SecondAdmin': 'Operations Manager',
};

async function updatePositions() {
  try {
    console.log('Starting position updates...');

    for (const [fullName, position] of Object.entries(positionMap)) {
      const updated = await prisma.employee.updateMany({
        where: { fullName },
        data: { position },
      });

      console.log(`✓ Updated "${fullName}" to position: "${position}" (${updated.count} record(s))`);
    }

    console.log('\n✅ All positions updated successfully!');
  } catch (error) {
    console.error('❌ Error updating positions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePositions();
