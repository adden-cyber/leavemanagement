import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can delete appraisals
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        // Get the appraisal to verify it exists
        const appraisal = await prisma.appraisal.findUnique({
            where: { id }
        });

        if (!appraisal) {
            return NextResponse.json({ error: 'Appraisal not found' }, { status: 404 });
        }

        // Delete the appraisal
        await prisma.appraisal.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete appraisal:', error);
        return NextResponse.json(
            { error: 'Failed to delete appraisal' },
            { status: 500 }
        );
    }
}
