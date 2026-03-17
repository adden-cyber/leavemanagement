import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        let goals;

        if (session?.user?.role === 'ADMIN') {
            // Admin sees everything
            goals = await prisma.goal.findMany({
                include: {
                    assignments: {
                        include: {
                            employee: { select: { id: true, fullName: true, userId: true } }
                        }
                    }
                },
                orderBy: { dueDate: 'asc' }
            });
        } else {
            // Non-admin users only see goals assigned to them
            if (!session?.user?.id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const employee = await prisma.employee.findUnique({
                where: { userId: session.user.id }
            });
            if (!employee) {
                // Not linked to an employee record
                return NextResponse.json([], { status: 200 });
            }

            goals = await prisma.goal.findMany({
                where: {
                    assignments: {
                        some: { employeeId: employee.id }
                    }
                },
                include: {
                    assignments: {
                        include: {
                            employee: { select: { id: true, fullName: true, userId: true } }
                        }
                    }
                },
                orderBy: { dueDate: 'asc' }
            });
        }

        return NextResponse.json(goals);
    } catch (error) {
        console.error('Failed to fetch goals:', error);
        return NextResponse.json(
            { error: 'Failed to fetch goals', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { title, description, dueDate, employeeIds }: {
            title: string;
            description: string;
            dueDate: string;
            employeeIds?: string[];
        } = body;

        if (employeeIds && !Array.isArray(employeeIds)) {
            return NextResponse.json(
                { error: 'Employee IDs must be an array' },
                { status: 400 }
            );
        }

        // Validate that all employee IDs exist
        if (employeeIds && employeeIds.length > 0) {
            const existingEmployees = await prisma.employee.findMany({
                where: { id: { in: employeeIds } },
                select: { id: true }
            });
            const existingIds = existingEmployees.map(e => e.id);
            const invalidIds = employeeIds.filter(id => !existingIds.includes(id));
            if (invalidIds.length > 0) {
                return NextResponse.json(
                    { error: `Invalid employee IDs: ${invalidIds.join(', ')}` },
                    { status: 400 }
                );
            }
        }

        // Create the goal
        const goal = await prisma.goal.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                status: 'NOT_STARTED'
            }
        });

        // Create assignments for each employee
        const assignments = employeeIds && employeeIds.length > 0
            ? await Promise.all(
                employeeIds.map((employeeId: string) =>
                    prisma.goalAssignment.create({
                        data: {
                            goalId: goal.id,
                            employeeId,
                            status: 'NOT_STARTED'
                        },
                        include: {
                            employee: { select: { id: true, fullName: true } }
                        }
                    })
                )
            )
            : [];

        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: session.user.id,
                    userName: session.user.name || session.user.email?.split('@')[0] || 'Admin',
                    action: `Created goal: ${title}`,
                    metadata: { goalId: goal.id }
                }
            });
        } catch (err) {
            console.error('Failed to create activity for goal', err);
        }

        return NextResponse.json({
            ...goal,
            assignments
        });
    } catch (error) {
        console.error('Failed to create goal:', error);
        return NextResponse.json(
            { error: 'Failed to create goal' },
            { status: 500 }
        );
    }
}
