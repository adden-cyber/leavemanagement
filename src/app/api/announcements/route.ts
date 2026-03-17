import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        return NextResponse.json(announcements);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch announcements' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const announcement = await prisma.announcement.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: session.user.id,
                status: body.status || 'PUBLISHED',
            },
        });
        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: session.user.id,
                    userName: session.user.name || session.user.email?.split('@')[0] || 'Admin',
                    action: `Posted announcement: ${body.title}`,
                    metadata: { announcementId: announcement.id },
                }
            });
        } catch (err) {
            console.error('Failed to create activity for announcement', err);
        }

        return NextResponse.json(announcement);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create announcement' },
            { status: 500 }
        );
    }
}
