import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const appraisals = await prisma.appraisal.findMany({
            include: { employee: { select: { fullName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(appraisals);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch appraisals' },
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
        const appraisal = await prisma.appraisal.create({
            data: {
                employeeId: body.employeeId,
                period: body.period,
                rating: body.rating ? parseInt(body.rating) : null,
                comments: body.comments,
                status: body.status || 'DRAFT',
            },
        });
        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: session.user.id,
                    userName: session.user.name || session.user.email?.split('@')[0] || 'Admin',
                    action: `Created appraisal for employee ${body.employeeId}`,
                    metadata: { appraisalId: appraisal.id }
                }
            });
        } catch (err) {
            console.error('Failed to create activity for appraisal', err);
        }

        return NextResponse.json(appraisal);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create appraisal' },
            { status: 500 }
        );
    }
}
