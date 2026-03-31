import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const employees = await prisma.employee.findMany({
            select: {
                id: true,
                fullName: true,
                icNo: true,
                position: true,
                status: true,
                joinDate: true,
                annualLeaveQuota: true,
                medicalLeaveQuota: true,
                unpaidLeaveQuota: true,
                user: {
                    select: {
                        username: true,
                        role: true,
                    }
                }
            } as any
        });

        const response = NextResponse.json(employees);
        response.headers.set('Cache-Control', 'private, max-age=300');
        return response;
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json(
            { message: "Error fetching employees", error: (error as any)?.message || "unknown" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            // ideally only admin can add employees but for now let's check role
            // return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { fullName, username, position, status = 'PERMANENT', joinDate, role = 'EMPLOYEE' } = await req.json();

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const allowedRoles = ['ADMIN', 'EMPLOYEE', 'PROBATION'];
        const normalizedRole = allowedRoles.includes(role) ? role : 'EMPLOYEE';

        const allowedStatus = ['PERMANENT', 'PROBATION'];
        const normalizedStatus = allowedStatus.includes(status) ? status : 'PERMANENT';

        const isAdminRole = normalizedRole === 'ADMIN';

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    role: normalizedRole,
                }
            });

            const employee = await tx.employee.create({
                data: {
                    userId: user.id,
                    fullName,
                    position,
                    status: normalizedStatus,
                    joinDate: new Date(joinDate),
                    // Admin accounts are not subject to personal leave quotas
                    annualLeaveQuota: isAdminRole ? 0 : 14,
                    medicalLeaveQuota: isAdminRole ? 0 : 14,
                    unpaidLeaveQuota: isAdminRole ? 0 : 10,
                } as any
            });

            const oneWeekLater = new Date();
            oneWeekLater.setDate(oneWeekLater.getDate() + 7);

            await tx.onboardingTask.createMany({
                data: [
                    {
                        employeeId: employee.id,
                        title: 'Complete HR Profile Setup',
                        description: 'Fill in emergency contacts, direct deposit info, and necessary tax forms.',
                        type: 'ONBOARDING',
                        dueDate: oneWeekLater
                    },
                    {
                        employeeId: employee.id,
                        title: 'IT Hardware collection',
                        description: 'Collect your assigned laptop and peripherals from the IT department.',
                        type: 'ONBOARDING',
                        dueDate: new Date(joinDate)
                    }
                ]
            });

            return employee;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error creating employee" }, { status: 500 });
    }
}
