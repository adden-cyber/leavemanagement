/**
 * Run this script to migrate existing SQLite data into MongoDB Atlas.
 *
 * Usage:
 *   node scripts/migrate-sqlite-to-mongo.js
 *
 * Requirements:
 * - Your `.env` must contain a valid `DATABASE_URL` pointing at MongoDB Atlas.
 * - The local SQLite file must exist at `./prisma/dev.db` (default prisma dev DB).
 *
 * This script will:
 * 1) Read from SQLite using Prisma (sqlite URL)
 * 2) Write into MongoDB Atlas using Prisma (DATABASE_URL)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const sqliteUrl = 'file:./prisma/dev.db';
  const mongoUrl = process.env.DATABASE_URL;

  if (!mongoUrl) {
    throw new Error('DATABASE_URL is not set in .env');
  }

  const sqlite = new PrismaClient({
    datasources: {
      db: { url: sqliteUrl },
    },
  });

  const mongo = new PrismaClient({
    datasources: {
      db: { url: mongoUrl },
    },
  });

  console.log('Reading data from SQLite...');
  const employees = await sqlite.employee.findMany({
    include: { user: true },
  });
  const leaveRequests = await sqlite.leaveRequest.findMany();

  console.log(`Found ${employees.length} employees and ${leaveRequests.length} leave records.`);

  console.log('Writing employees to MongoDB...');
  for (const emp of employees) {
    await mongo.employee.upsert({
      where: { id: emp.id },
      update: {
        fullName: emp.fullName,
        icNo: emp.icNo,
        position: emp.position,
        department: emp.department,
        joinDate: emp.joinDate,
        workingStatus: emp.workingStatus,
        profileImage: emp.profileImage,
        bannerImage: emp.bannerImage,
        bio: emp.bio,
      },
      create: {
        id: emp.id,
        userId: emp.userId,
        fullName: emp.fullName,
        icNo: emp.icNo,
        position: emp.position,
        department: emp.department,
        joinDate: emp.joinDate,
        workingStatus: emp.workingStatus,
        profileImage: emp.profileImage,
        bannerImage: emp.bannerImage,
        bio: emp.bio,
      },
    });
  }

  console.log('Writing leave requests to MongoDB...');
  for (const leave of leaveRequests) {
    await mongo.leaveRequest.upsert({
      where: { id: leave.id },
      update: {
        status: leave.status,
        managerNote: leave.managerNote,
        reason: leave.reason,
        type: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
      },
      create: {
        id: leave.id,
        employeeId: leave.employeeId,
        startDate: leave.startDate,
        endDate: leave.endDate,
        type: leave.type,
        reason: leave.reason,
        status: leave.status,
        managerNote: leave.managerNote,
      },
    });
  }

  console.log('Migration complete.');

  await sqlite.$disconnect();
  await mongo.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
