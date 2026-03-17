import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function test() {
  try {
    const email = 'testuser@example.com';
    const password = 'password123';
    const name = 'Test User';

    console.log('checking existing user');
    const existing = await prisma.user.findUnique({ where: { email } });
    console.log('existing user:', existing);
    if (existing) {
      console.log('user already exists, deleting for test');
      await prisma.user.delete({ where: { email } });
    }

    const hashed = await bcrypt.hash(password, 10);
    console.log('hashed password');

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: 'EMPLOYEE',
        employee: { create: { fullName: name, position: 'TBD', department: 'TBD' } },
      },
    });
    console.log('created user', user);
  } catch (e) {
    console.error('error during test registration', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
