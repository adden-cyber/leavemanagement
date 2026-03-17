import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = session?.user?.role === 'ADMIN';

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        // Run multiple queries in parallel for better performance
        const [
            leavesThisMonth,
            newHiresThisMonth,
            openJobs,
            pendingLeave,
            pendingClaims,
            myTotalLeavesAppliedResult,
            annualLeaves,
            unpaidLeaves,
            medicalLeaves,
            monthlyLeaves
        ] = await Promise.all([
            prisma.leaveRequest.count({
                where: { createdAt: { gte: startOfMonth } }
            }),
            prisma.employee.count({ where: { joinDate: { gte: startOfMonth } } }),
            prisma.jobPosting.count({ where: { status: 'OPEN' } }),
            prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
            prisma.expenseClaim.count({ where: { status: 'PENDING' } }),
            isAdmin ? Promise.resolve(0) : (async () => {
                if (!session?.user?.id) return 0;
                const employee = await prisma.employee.findUnique({
                    where: { userId: session.user.id }
                });
                return employee ? prisma.leaveRequest.count({
                    where: { employeeId: employee.id }
                }) : 0;
            })(),
            prisma.leaveRequest.count({ where: { type: 'ANNUAL' } }),
            prisma.leaveRequest.count({ where: { type: 'UNPAID' } }),
            prisma.leaveRequest.count({ where: { type: 'MEDICAL' } }),
            // Monthly and weekly leaves for the last 12 months
            (async () => {
                const leaves = await prisma.leaveRequest.findMany({
                    where: {
                        status: 'APPROVED',
                        startDate: {
                            gte: new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate())
                        }
                    },
                    select: { startDate: true }
                });

                // Monthly data
                const monthlyCount: { [key: string]: number } = {};
                // Weekly data
                const weeklyCount: { [key: string]: number } = {};

                leaves.forEach(leave => {
                    const year = leave.startDate.getFullYear();
                    const month = leave.startDate.getMonth() + 1;
                    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

                    // Calculate week of month (1-5)
                    const firstDayOfMonth = new Date(year, month - 1, 1);
                    const dayOfMonth = leave.startDate.getDate();
                    const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);
                    const weekKey = `${monthKey}-W${weekOfMonth}`;

                    monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;
                    weeklyCount[weekKey] = (weeklyCount[weekKey] || 0) + 1;
                });

                const monthlyLeaves = Object.entries(monthlyCount)
                    .map(([month, count]) => ({ period: month, count }))
                    .sort((a, b) => a.period.localeCompare(b.period));

                const weeklyLeaves = Object.entries(weeklyCount)
                    .map(([week, count]) => ({ period: week, count }))
                    .sort((a, b) => a.period.localeCompare(b.period));

                return { monthly: monthlyLeaves, weekly: weeklyLeaves };
            })()
        ]);

        const pendingTasks = pendingLeave + pendingClaims;

        // Get recent activities in parallel
        const [
            recentLeaves,
            recentClaims,
            recentHires,
            recentJobs
        ] = await Promise.all([
            prisma.leaveRequest.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' },
                include: { employee: { select: { fullName: true } } }
            }),
            prisma.expenseClaim.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' },
                include: { employee: { select: { fullName: true } } }
            }),
            prisma.employee.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' },
                select: { id: true, fullName: true, createdAt: true }
            }),
            prisma.jobPosting.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' },
                select: { id: true, title: true, createdAt: true }
            })
        ]);

        // Merge and format activities
        let activities: any[] = [
            ...recentLeaves.map(l => ({ id: `l-${l.id}`, user: l.employee.fullName, action: `Submitted a ${l.type} leave request`, date: l.createdAt })),
            ...recentClaims.map(c => ({ id: `c-${c.id}`, user: c.employee.fullName, action: `Submitted a ${c.type} expense claim`, date: c.createdAt })),
            ...recentHires.map(e => ({ id: `e-${e.id}`, user: 'System', action: `Onboarded new employee ${e.fullName}`, date: e.createdAt })),
            ...recentJobs.map(j => ({ id: `j-${j.id}`, user: 'Roro Leave Management System', action: `Posted job: ${j.title}`, date: j.createdAt })),
        ];

        // Sort and format
        activities.sort((a, b) => b.date.getTime() - a.date.getTime());

        const formatTimeAgo = (date: Date) => {
            const seconds = Math.max(0, Math.floor((new Date().getTime() - date.getTime()) / 1000));
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + " years ago";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + " months ago";
            interval = seconds / 86400;
            if (interval >= 1 && interval < 2) return "Yesterday";
            if (interval > 1) return Math.floor(interval) + " days ago";
            interval = seconds / 3600;
            if (interval >= 1) return Math.floor(interval) + " hours ago";
            interval = seconds / 60;
            if (interval >= 1) return Math.floor(interval) + " minutes ago";
            return "Just now";
        };

        const recentActivity = activities.slice(0, 5).map(a => ({
            id: a.id,
            user: a.user,
            action: a.action,
            time: formatTimeAgo(a.date)
        }));

        return NextResponse.json({
            isAdmin,
            pendingLeaveRequests: pendingLeave,
            myTotalLeavesApplied: myTotalLeavesAppliedResult,
            leavesThisMonth,
            newHiresThisMonth,
            openJobs,
            pendingTasks,
            annualLeaves,
            unpaidLeaves,
            medicalLeaves,
            leaveData: monthlyLeaves,
            recentActivity
        });
    } catch (error) {
        console.error('Error computing analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
}
