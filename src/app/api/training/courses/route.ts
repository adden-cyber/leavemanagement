import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const courses = await prisma.course.findMany({
            include: {
                _count: {
                    select: { employees: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch courses' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const course = await prisma.course.create({
            data: {
                title: body.title,
                description: body.description,
                provider: body.provider,
                link: body.link,
                mandatory: body.mandatory || false,
            },
        });
        // Log activity
        try {
            const session = await getServerSession(authOptions);
            await prisma.activity.create({
                data: {
                    userId: session?.user?.id,
                    userName: session?.user?.name || 'Admin',
                    action: `Created training course: ${body.title}`,
                    metadata: { courseId: course.id }
                }
            });
        } catch (err) {
            console.error('Failed to create activity for course', err);
        }

        return NextResponse.json(course);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create course' },
            { status: 500 }
        );
    }
}
