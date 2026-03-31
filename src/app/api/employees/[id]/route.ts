import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: { user: { select: { username: true, role: true } } }
        });

        if (!employee) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        return NextResponse.json(employee);
    } catch (error) {
        console.error("Failed to fetch employee:", error);
        return NextResponse.json({ message: "Error fetching employee" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { role, position, status, fullName, icNo, annualLeaveQuota, medicalLeaveQuota, unpaidLeaveQuota } = await req.json();

        // Check if employee exists and verify ownership
        const currentEmployee = await prisma.employee.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!currentEmployee) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        const isAdmin = session.user.role === 'ADMIN';
        const currentUsername = ((session.user as any).username as string | undefined) || session.user.email;
        const isSelf = currentEmployee.user?.username === currentUsername;

        // Only ADMIN can update other employees' records
        if (!isAdmin && !isSelf) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Determine the employee role after update (keep existing if not provided)
        const targetRole = role ?? currentEmployee.user?.role ?? 'EMPLOYEE';
        const targetIsAdmin = targetRole === 'ADMIN';

        // Transaction to update both Employee and User models
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update Employee details
            const dataToUpdate: any = { fullName };
            if (icNo !== undefined) {
                dataToUpdate.icNo = icNo;
            }

            if (isAdmin) {
                if (position !== undefined) dataToUpdate.position = position;
                if (status !== undefined) {
                    const allowedStatus = ['PERMANENT', 'PROBATION'];
                    dataToUpdate.status = allowedStatus.includes(status) ? status : 'PERMANENT';
                }

                if (targetIsAdmin) {
                    // Admin users do not consume leave quotas
                    dataToUpdate.annualLeaveQuota = 0;
                    dataToUpdate.medicalLeaveQuota = 0;
                    dataToUpdate.unpaidLeaveQuota = 0;
                } else {
                    if (annualLeaveQuota !== undefined) dataToUpdate.annualLeaveQuota = Math.max(0, parseInt(String(annualLeaveQuota), 10) || 0);
                    if (medicalLeaveQuota !== undefined) dataToUpdate.medicalLeaveQuota = Math.max(0, parseInt(String(medicalLeaveQuota), 10) || 0);
                    if (unpaidLeaveQuota !== undefined) dataToUpdate.unpaidLeaveQuota = Math.max(0, parseInt(String(unpaidLeaveQuota), 10) || 0);
                }
            }

            const employee = await tx.employee.update({
                where: { id },
                data: dataToUpdate as any,
                include: { user: true }
            });

            // 2. Update User role if provided (Only admin)
            if (isAdmin && role && employee.userId) {
                await tx.user.update({
                    where: { id: employee.userId },
                    data: { role }
                });
            }

            return employee;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to update employee:", error);
        return NextResponse.json({ message: "Error updating employee" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const employee = await prisma.employee.findUnique({ where: { id } });

        if (!employee) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        await prisma.user.delete({ where: { id: employee.userId } });

        return NextResponse.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Failed to delete employee:", error);
        return NextResponse.json({ message: "Error deleting employee" }, { status: 500 });
    }
}
