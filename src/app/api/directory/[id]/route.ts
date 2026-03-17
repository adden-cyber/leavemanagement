import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const employeeStats = await prisma.employee.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, email: true, role: true }
                },
                attendanceRecord: {
                    orderBy: { date: 'desc' },
                    take: 30 // Last 30 attendance records
                },
                leaveRequests: {
                    where: { status: 'APPROVED' }
                }
            }
        });

        if (!employeeStats) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        // Calculate some basic stats
        const totalLeaves = employeeStats.leaveRequests.reduce((acc, leave) => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return acc + days;
        }, 0);

        const presentDays = employeeStats.attendanceRecord.filter(a => a.status === 'PRESENT').length;
        const absentDays = employeeStats.attendanceRecord.filter(a => a.status === 'ABSENT').length;
        const lateDays = employeeStats.attendanceRecord.filter(a => a.status === 'LATE').length;

        // Check if current user can view leave breakdown
        const canViewLeaveBreakdown = session.user.role === 'ADMIN' || session.user.id === employeeStats.user.id;

        let leaveBreakdown = null;
        if (canViewLeaveBreakdown) {
            const annualLeaves = employeeStats.leaveRequests
                .filter(leave => leave.type === 'ANNUAL')
                .reduce((acc, leave) => {
                    const start = new Date(leave.startDate);
                    const end = new Date(leave.endDate);
                    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return acc + days;
                }, 0);

            const medicalLeaves = employeeStats.leaveRequests
                .filter(leave => leave.type === 'MEDICAL')
                .reduce((acc, leave) => {
                    const start = new Date(leave.startDate);
                    const end = new Date(leave.endDate);
                    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return acc + days;
                }, 0);

            const unpaidLeaves = employeeStats.leaveRequests
                .filter(leave => leave.type === 'UNPAID')
                .reduce((acc, leave) => {
                    const start = new Date(leave.startDate);
                    const end = new Date(leave.endDate);
                    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return acc + days;
                }, 0);

            leaveBreakdown = {
                annual: annualLeaves,
                medical: medicalLeaves,
                unpaid: unpaidLeaves
            };
        }

        return NextResponse.json({
            id: employeeStats.id,
            fullName: employeeStats.fullName,
            position: employeeStats.position,
            department: employeeStats.department,
            email: employeeStats.user.email,
            joinDate: employeeStats.joinDate,
            stats: {
                presentDays,
                absentDays,
                lateDays,
                totalLeaves,
                leaveBreakdown
            },
            recentAttendance: employeeStats.attendanceRecord.slice(0, 5) // Send 5 recent records for preview
        });

    } catch (error) {
        console.error("Failed to fetch employee stats:", error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
