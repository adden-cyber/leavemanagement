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
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        console.log('Goal update body:', body, 'for goal', id);
        const { status, rating } = body;

        const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const validRatings = ['A', 'B', 'C', 'D', 'F'];
        if (rating && !validRatings.includes(rating)) {
            return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
        }

        const data: any = {};
        if (status) data.status = status;
        if (rating !== undefined) data.rating = rating;

        const updatedGoal = await prisma.goal.update({
            where: { id },
            data,
        });

        return NextResponse.json(updatedGoal);
    } catch (error) {
        console.error('Failed to update goal:', error);
        return NextResponse.json(
            { error: 'Failed to update goal' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get the goal with all assignments
        const goal = await prisma.goal.findUnique({
            where: { id },
            include: { assignments: true }
        });

        if (!goal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        const allCompleted = goal.assignments.every(a => a.status === 'COMPLETED');
        if (!allCompleted || goal.status !== 'COMPLETED') {
            return NextResponse.json(
                {
                    error: 'Cannot delete goal: It must be fully completed and approved by admin before deletion',
                    incompleteCount: goal.assignments.filter(a => a.status !== 'COMPLETED').length,
                    totalAssigned: goal.assignments.length,
                    goalStatus: goal.status
                },
                { status: 400 }
            );
        }

        await prisma.goal.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete goal:', error);
        return NextResponse.json(
            { error: 'Failed to delete goal' },
            { status: 500 }
        );
    }
}
