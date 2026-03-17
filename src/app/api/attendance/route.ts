import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        let whereClause = {};
        if (session.user.role !== 'ADMIN') {
            const employee = await prisma.employee.findUnique({
                where: { userId: session.user.id }
            });
            if (!employee) {
                return NextResponse.json({ message: "Employee profile not found" }, { status: 404 });
            }
            whereClause = { employeeId: employee.id };
        }

        const attendance = await prisma.attendance.findMany({
            where: whereClause,
            include: {
                employee: {
                    select: { fullName: true }
                }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(attendance);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching attendance" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        let employee = await prisma.employee.findUnique({
            where: { userId: session.user.id }
        });

        // If admin doesn't have an employee profile, create one
        if (!employee && session.user.role === 'ADMIN') {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id }
            });
            if (user) {
                employee = await prisma.employee.create({
                    data: {
                        userId: session.user.id,
                        fullName: user.email.split('@')[0], // Use email prefix as name
                        position: 'Admin',
                        department: 'Management',
                    }
                });
            }
        }

        if (!employee) {
            return NextResponse.json({ message: "Employee profile not found" }, { status: 404 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { type } = await req.json(); // "check-in" or "check-out"

        if (type === 'check-in') {
            const existing = await prisma.attendance.findUnique({
                where: {
                    employeeId_date: {
                        employeeId: employee.id,
                        date: today
                    }
                }
            });

            if (existing) {
                return NextResponse.json({ message: "Already checked in today" }, { status: 400 });
            }

            const attendance = await prisma.attendance.create({
                data: {
                    employeeId: employee.id,
                    date: today,
                    checkIn: new Date(),
                    status: 'PRESENT'
                }
            });
            // Log activity
            try {
                await prisma.activity.create({
                    data: {
                        userId: session.user.id,
                        userName: employee.fullName,
                        action: `Checked in`,
                        metadata: { attendanceId: attendance.id }
                    }
                });
            } catch (err) {
                console.error('Failed to create activity for check-in', err);
            }

            return NextResponse.json(attendance);

        } else if (type === 'check-out') {
            const existing = await prisma.attendance.findUnique({
                where: {
                    employeeId_date: {
                        employeeId: employee.id,
                        date: today
                    }
                }
            });

            if (!existing) {
                return NextResponse.json({ message: "You have not checked in yet" }, { status: 400 });
            }

            const attendance = await prisma.attendance.update({
                where: { id: existing.id },
                data: { checkOut: new Date() }
            });
            // Log activity
            try {
                await prisma.activity.create({
                    data: {
                        userId: session.user.id,
                        userName: employee.fullName,
                        action: `Checked out`,
                        metadata: { attendanceId: attendance.id }
                    }
                });
            } catch (err) {
                console.error('Failed to create activity for check-out', err);
            }

            return NextResponse.json(attendance);
        }

        return NextResponse.json({ message: "Invalid type" }, { status: 400 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error processing attendance" }, { status: 500 });
    }
}
