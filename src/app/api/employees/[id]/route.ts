import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { role, position, status, fullName, icNo } = await req.json();

        // Check if employee exists and verify ownership
        const currentEmployee = await prisma.employee.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!currentEmployee) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        const isAdmin = session.user.role === 'ADMIN';
        const isSelf = currentEmployee.user?.email === session.user.email;

        // Only ADMIN can update other employees' records
        if (!isAdmin && !isSelf) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

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
