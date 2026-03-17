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
        if (status) {
            whereClause.status = status;
        }

        const jobs = await prisma.jobPosting.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { applicants: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(jobs);
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return NextResponse.json({ message: "Error fetching jobs" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { title, department, location, type, description } = await req.json();

        if (!title || !department || !description) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const job = await prisma.jobPosting.create({
            data: {
                title,
                department,
                location: location || "Remote",
                type: type || "FULL_TIME",
                description,
                status: "OPEN"
            }
        });

        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: session.user.id,
                    userName: session.user.name || session.user.email?.split('@')[0] || 'Admin',
                    action: `Posted job: ${title}`,
                    metadata: { jobId: job.id }
                }
            });
        } catch (err) {
            console.error('Failed to create activity for job posting', err);
        }

        return NextResponse.json(job, { status: 201 });
    } catch (error) {
        console.error("Error creating job:", error);
        return NextResponse.json({ message: "Error creating job" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id, title, department, location, type, description, status } = await req.json();

        if (!id) {
            return NextResponse.json({ message: "Missing job ID" }, { status: 400 });
        }

        const job = await prisma.jobPosting.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(department && { department }),
                ...(location && { location }),
                ...(type && { type }),
                ...(description && { description }),
                ...(status && { status }),
            }
        });

        return NextResponse.json(job);
    } catch (error) {
        console.error("Error updating job:", error);
        return NextResponse.json({ message: "Error updating job" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: "Missing job ID" }, { status: 400 });
        }

        await prisma.jobPosting.delete({ where: { id } });

        return NextResponse.json({ message: "Job deleted successfully" });
    } catch (error) {
        console.error("Error deleting job:", error);
        return NextResponse.json({ message: "Error deleting job" }, { status: 500 });
    }
}
