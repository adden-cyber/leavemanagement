import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const tasks = await prisma.onboardingTask.findMany({
            include: { employee: { select: { fullName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(tasks);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch onboarding tasks' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const task = await prisma.onboardingTask.create({
            data: {
                employeeId: body.employeeId,
                title: body.title,
                description: body.description,
                type: body.type || 'ONBOARDING',
                status: body.status || 'PENDING',
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
            },
        });
        // Log activity
        try {
            const session = await getServerSession(authOptions);
            await prisma.activity.create({
                data: {
                    userId: session?.user?.id,
                    userName: session?.user?.name || 'Admin',
                    action: `Created onboarding task: ${body.title}`,
                    metadata: { taskId: task.id }
                }
            });
        } catch (err) {
            console.error('Failed to create activity for onboarding task', err);
        }

        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create onboarding task' },
            { status: 500 }
        );
    }
}

// Optional: Add a PATCH / PUT route here if you wanted to mark tasks as complete in the UI.
