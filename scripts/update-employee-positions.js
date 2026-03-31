const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Updating positions based on user roles...\n');

    // Update all employees based on their role
    const employees = await prisma.employee.findMany({
      include: { user: { select: { role: true } } },
    });

    for (const emp of employees) {
      const newPosition = emp.user?.role === 'ADMIN' ? 'Admin' : 'Employee';
      
      await prisma.employee.update({
        where: { id: emp.id },
        data: { position: newPosition },
      });

      console.log(`✓ ${emp.fullName}: ${newPosition}`);
    }

    console.log('\n✅ All positions updated based on role!');
  } catch (error) {
    console.error('❌ Error updating positions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
