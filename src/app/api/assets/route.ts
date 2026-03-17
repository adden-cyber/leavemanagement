import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const assets = await prisma.asset.findMany({
            include: { employee: { select: { fullName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(assets);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch assets' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const body = await request.json();
        const asset = await prisma.asset.create({
            data: {
                name: body.name,
                category: body.category,
                serialNumber: body.serialNumber || null,
                employeeId: body.employeeId || null,
                status: body.employeeId ? 'ASSIGNED' : 'AVAILABLE',
                assignedAt: body.employeeId ? new Date() : null,
            },
        });
        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: session?.user?.id,
                    userName: session?.user?.name || 'Admin',
                    action: `Created asset: ${body.name}`,
                    metadata: { assetId: asset.id }
                }
            });
        } catch (err) {
            console.error('Failed to create activity for asset', err);
        }

        return NextResponse.json(asset);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create asset' },
            { status: 500 }
        );
    }
}
