import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        // Get the assignment
        const assignment = await prisma.goalAssignment.findUnique({
            where: { id },
            include: { employee: { select: { userId: true } } }
        });

        if (!assignment) {
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }

        // Only the assigned employee can update their assignment
        if (assignment.employee.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Build update payload (including timestamps)
        console.log('Updating assignment', id, 'status to', status);
        const updateData: any = { status };
        // if marking in-progress and we haven't recorded a start yet, set it
        if (status === 'IN_PROGRESS' && !assignment.startedAt) {
            updateData.startedAt = new Date();
        }
        // if marking completed, stamp completion time
        if (status === 'COMPLETED' && !assignment.completedAt) {
            updateData.completedAt = new Date();
        }

        // attempt update; if DB schema doesn't yet have the timestamp columns,
        // retry without them so we don't break existing databases.
        let updatedAssignment;
        try {
            updatedAssignment = await prisma.goalAssignment.update({
                where: { id },
                data: updateData,
                include: {
                    goal: true,
                    employee: { select: { fullName: true } }
                }
            });
        } catch (e: any) {
            const msg = (e.message || '').toLowerCase();
            if (msg.includes('startedat') || msg.includes('completedat')) {
                // column doesn't exist yet – retry with just status
                updatedAssignment = await prisma.goalAssignment.update({
                    where: { id },
                    data: { status },
                    include: {
                        goal: true,
                        employee: { select: { fullName: true } }
                    }
                });
            } else {
                throw e;
            }
        }

        // If this assignment was marked completed, check whether all
        // other assignments for the same goal are also completed.
        if (status === 'COMPLETED') {
            const goalWithAssignments = await prisma.goal.findUnique({
                where: { id: updatedAssignment.goalId },
                include: { assignments: true }
            });

            if (goalWithAssignments) {
                const allDone = goalWithAssignments.assignments.every(a => a.status === 'COMPLETED');
                if (allDone && goalWithAssignments.status !== 'AWAITING_APPROVAL' && goalWithAssignments.status !== 'COMPLETED') {
                    // bump goal status so admin can review
                    await prisma.goal.update({
                        where: { id: goalWithAssignments.id },
                        data: { status: 'AWAITING_APPROVAL' }
                    });
                }
            }
        }

        return NextResponse.json(updatedAssignment);
    } catch (error) {
        console.error('Failed to update assignment:', error);
        return NextResponse.json(
            { error: 'Failed to update assignment' },
            { status: 500 }
        );
    }
}
