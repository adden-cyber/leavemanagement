import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Only admins can approve/reject leave requests
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Forbidden: Only admins can update leave request status" }, { status: 403 });
        }

        const { status, managerNote } = await req.json(); // "APPROVED" or "REJECTED"

        const leaveRequest = await prisma.leaveRequest.update({
            where: { id: id },
            data: {
                status,
                managerNote
            }
        });

        return NextResponse.json(leaveRequest);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error updating leave request" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Get the leave request to check ownership
        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: id },
            include: { employee: true }
        });

        if (!leaveRequest) {
            return NextResponse.json({ message: "Leave request not found" }, { status: 404 });
        }

        // Check if user owns this leave request or is admin
        const employee = await prisma.employee.findUnique({
            where: { userId: session.user.id }
        });

        if (!employee || (leaveRequest.employeeId !== employee.id && session.user.role !== 'ADMIN')) {
            return NextResponse.json({ message: "Forbidden: You can only delete your own leave requests" }, { status: 403 });
        }

        await prisma.leaveRequest.delete({
            where: { id: id }
        });

        return NextResponse.json({ message: "Leave request deleted" });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error deleting leave request" }, { status: 500 });
    }
}
