import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const benefits = await prisma.benefit.findMany({
            include: { employee: { select: { fullName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(benefits);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch benefits' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const body = await request.json();
        const benefit = await prisma.benefit.create({
            data: {
                employeeId: body.employeeId,
                type: body.type,       // e.g., 'HEALTH_INSURANCE'
                provider: body.provider,
                coverage: body.coverage,
                cost: body.cost ? parseFloat(body.cost) : 0,
                startDate: new Date(body.startDate),
                endDate: body.endDate ? new Date(body.endDate) : null,
                status: body.status || 'ACTIVE'
            },
        });
        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: session?.user?.id,
                    userName: session?.user?.name || 'Admin',
                    action: `Added benefit for employee ${body.employeeId}: ${body.type}`,
                    metadata: { benefitId: benefit.id }
                }
            });
        } catch (err) {
            console.error('Failed to create activity for benefit', err);
        }

        return NextResponse.json(benefit);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create benefit' },
            { status: 500 }
        );
    }
}
