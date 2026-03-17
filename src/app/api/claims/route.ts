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
        const status = searchParams.get('status');

        let whereClause: any = {};

        // If employee, only show their own claims
        if (session.user.role !== 'ADMIN') {
            const emp = await prisma.employee.findUnique({ where: { userId: session.user.id } });
            if (!emp) return NextResponse.json({ message: "Employee not found" }, { status: 404 });
            whereClause.employeeId = emp.id;
        }

        if (status) {
            whereClause.status = status;
        }

        const claims = await prisma.expenseClaim.findMany({
            where: whereClause,
            include: {
                employee: {
                    select: {
                        fullName: true,
                        department: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(claims);
    } catch (error) {
        console.error("Error fetching claims:", error);
        return NextResponse.json({ message: "Error fetching claims" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { date, type, amount, description, receiptUrl } = await req.json();

        if (!date || !type || !amount || !description) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Find employee id for the logged-in user
        const emp = await prisma.employee.findUnique({ where: { userId: session.user.id } });
        if (!emp) {
            return NextResponse.json({ message: "Employee record not found" }, { status: 404 });
        }

        const claim = await prisma.expenseClaim.create({
            data: {
                employeeId: emp.id,
                date: new Date(date),
                type,
                amount: Number(amount),
                description,
                receiptUrl,
                status: "PENDING"
            }
        });

        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: session.user.id,
                    userName: emp.fullName,
                    action: `Submitted expense claim (${type}) - ${amount}`,
                    metadata: { claimId: claim.id }
                }
            });
        } catch (err) {
            console.error('Failed to create activity for claim', err);
        }

        return NextResponse.json(claim, { status: 201 });
    } catch (error) {
        console.error("Error creating claim:", error);
        return NextResponse.json({ message: "Error creating claim" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        // Only admins can approve/reject claims
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id, status, managerNote } = await req.json();

        if (!id || !status) {
            return NextResponse.json({ message: "Missing ID or status" }, { status: 400 });
        }

        const claim = await prisma.expenseClaim.update({
            where: { id },
            data: {
                status,
                managerNote
            }
        });

        return NextResponse.json(claim);
    } catch (error) {
        console.error("Error updating claim:", error);
        return NextResponse.json({ message: "Error updating claim" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: "Missing claim ID" }, { status: 400 });
        }

        const claim = await prisma.expenseClaim.findUnique({ where: { id } });
        if (!claim) {
            return NextResponse.json({ message: "Claim not found" }, { status: 404 });
        }

        // Only allow deletion if PENDING, and only by the creator (or Admin)
        if (claim.status !== 'PENDING') {
            return NextResponse.json({ message: "Only pending claims can be deleted" }, { status: 400 });
        }

        if (session.user.role !== 'ADMIN') {
            const emp = await prisma.employee.findUnique({ where: { userId: session.user.id } });
            if (!emp || emp.id !== claim.employeeId) {
                return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
            }
        }

        await prisma.expenseClaim.delete({ where: { id } });

        return NextResponse.json({ message: "Claim deleted successfully" });
    } catch (error) {
        console.error("Error deleting claim:", error);
        return NextResponse.json({ message: "Error deleting claim" }, { status: 500 });
    }
}
