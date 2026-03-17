import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        // 1. start with whatever real Activity rows exist (show full history)
        let recorded: any[] = [];
        try {
            recorded = await prisma.activity.findMany({
                orderBy: { createdAt: 'desc' },
                take: 100,
            });
        } catch (err: any) {
            // if the table doesn't exist yet, swallow the error and continue with
            // empty recorded list; the outer catch will still run later for
            // other failures.  This avoids noisy P2021 logs on a fresh database.
            if (err.code !== 'P2021') {
                throw err;
            }
            console.warn('Activities table missing, skipping recorded entries');
            recorded = [];
        }

        // 2. replicate the dashboard "recentActivity" synthesis so both views match
        // (see src/app/api/analytics/route.ts for reference)
        // Show full history for Activities category
        const recentLeaves = await prisma.leaveRequest.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: { employee: { select: { fullName: true } } }
        });
        const recentClaims = await prisma.expenseClaim.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: { employee: { select: { fullName: true } } }
        });
        const recentHires = await prisma.employee.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' }
        });
        const recentJobs = await prisma.jobPosting.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' }
        });

        // convert each to a common activity-like shape
        let extras: any[] = [
            ...recentLeaves.map(l => ({
                id: `l-${l.id}`,
                userName: l.employee.fullName,
                action: `Submitted a ${l.type} leave request`,
                createdAt: l.createdAt
            })),
            ...recentClaims.map(c => ({
                id: `c-${c.id}`,
                userName: c.employee.fullName,
                action: `Submitted a ${c.type} expense claim`,
                createdAt: c.createdAt
            })),
            ...recentHires.map(e => ({
                id: `e-${e.id}`,
                userName: 'System',
                action: `Onboarded new employee ${e.fullName}`,
                createdAt: e.createdAt
            })),
            ...recentJobs.map(j => ({
                id: `j-${j.id}`,
                userName: 'Roro Leave Management System',
                action: `Posted job: ${j.title}`,
                createdAt: j.createdAt
            }))
        ];

        // merge recorded + extras, sort and cap at 100 (showing full history)
        const merged = [...recorded, ...extras]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 100);

        return NextResponse.json(merged);
    } catch (error) {
        console.error('GET /api/activities error', error);
        // Prisma will throw a P2021 error when the target table doesn't exist.  Earlier
        // we attempted to match against a couple of textual phrases, but the actual
        // message in the log above is
        //
        //   "The table `main.Activity` does not exist in the current database."
        //
        // which doesn't match our old checks.  That's why the request was returning
        // a 500 instead of just an empty list when the migrations haven't been run.
        //
        // Handle both the known request error code and the previous string patterns
        // so that the UI can continue to render even when the database is still empty.
        const msg = (error && (error as any).message) || '';
        const code = (error && (error as any).code) || '';
        if (
            code === 'P2021' ||
            msg.toLowerCase().includes('no such table') ||
            msg.toLowerCase().includes('activity does not exist')
        ) {
            // Prisma/SQLite table not yet created — return empty list so UI doesn't break
            return NextResponse.json([]);
        }

        return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const body = await request.json();

        const activity = await prisma.activity.create({
            data: {
                userId: session?.user?.id,
                userName: body.userName || session?.user?.name || session?.user?.email?.split('@')[0] || 'System',
                action: body.action,
                metadata: body.metadata || undefined,
            }
        });

        return NextResponse.json(activity);
    } catch (error) {
        console.error('POST /api/activities error', error);
        const msg = (error && (error as any).message) || '';
        const code = (error && (error as any).code) || '';
        if (
            code === 'P2021' ||
            msg.toLowerCase().includes('no such table') ||
            msg.toLowerCase().includes('activity does not exist')
        ) {
            return NextResponse.json({ error: 'Activity table not found. Run prisma migrate.' }, { status: 503 });
        }
        return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
    }
}
