import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
