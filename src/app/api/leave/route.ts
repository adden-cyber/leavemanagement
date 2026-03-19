import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const employeeIdParam = searchParams.get('employeeId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20'); // Default 20 per page
        const statusFilter = searchParams.get('status'); // Optional status filter

        let whereClause: any = {};
        
        if (session.user.role !== 'ADMIN') {
            // Non-admin users can only access their own leaves
            const employee = await prisma.employee.findUnique({
                where: { userId: session.user.id }
            });
            if (!employee) {
                return NextResponse.json({ message: "Employee profile not found" }, { status: 404 });
            }
            whereClause = { employeeId: employee.id };
        } else if (employeeIdParam) {
            // Admin can access specific employee's leaves
            whereClause = { employeeId: employeeIdParam };
        }

        if (statusFilter) {
            whereClause.status = statusFilter;
        }

        const skip = (page - 1) * limit;

        const [leaves, totalCount] = await Promise.all([
            prisma.leaveRequest.findMany({
                where: whereClause,
                include: {
                    employee: {
                        select: { fullName: true, icNo: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.leaveRequest.count({ where: whereClause })
        ]);

        return NextResponse.json({
            leaves,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: page * limit < totalCount,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching leave requests" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const employee = await prisma.employee.findUnique({
            where: { userId: session.user.id }
        });

        if (!employee) {
            return NextResponse.json({ message: "Employee profile not found" }, { status: 404 });
        }

        const { startDate, endDate, reason, type, icNo, name } = await req.json();

        // Update employee details if provided
        if (icNo || name) {
            await prisma.employee.update({
                where: { id: employee.id },
                data: {
                    ...(icNo && { icNo }),
                    ...(name && { fullName: name })
                }
            });
        }

        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                employeeId: employee.id,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                type: type || 'ANNUAL',
            }
        });

        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: session.user.id,
                    userName: employee.fullName,
                    action: `Submitted leave request (${type || 'ANNUAL'}) from ${startDate} to ${endDate}`,
                    metadata: { leaveRequestId: leaveRequest.id }
                }
            });
        } catch (err) {
            console.error('Failed to create activity for leave request', err);
        }

        return NextResponse.json(leaveRequest, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error creating leave request" }, { status: 500 });
    }
}
