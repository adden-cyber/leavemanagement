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
                department: true,
                joinDate: true,
                user: {
                    select: {
                        email: true,
                        role: true,
                    }
                }
            }
        });

        const response = NextResponse.json(employees);
        response.headers.set('Cache-Control', 'private, max-age=300');
        return response;
    } catch (error) {
        return NextResponse.json({ message: "Error fetching employees" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            // ideally only admin can add employees but for now let's check role
            // return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { fullName, email, position, department, joinDate } = await req.json();

        // Create user first (as employee needs userId)
        // For simplicity, we create a user with default password 'password123'
        // In a real app, we'd send an invite email
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: 'EMPLOYEE',
                }
            });

            const employee = await tx.employee.create({
                data: {
                    userId: user.id,
                    fullName,
                    position,
                    department,
                    joinDate: new Date(joinDate),
                }
            });

            // Automatically Generate Onboarding Tasks
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
