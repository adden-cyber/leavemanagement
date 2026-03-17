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
        const jobId = searchParams.get('jobId');

        let whereClause: any = {};
        if (jobId) {
            whereClause.jobPostingId = jobId;
        }

        const applicants = await prisma.applicant.findMany({
            where: whereClause,
            include: {
                jobPosting: {
                    select: {
                        title: true,
                        department: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(applicants);
    } catch (error) {
        console.error("Error fetching applicants:", error);
        return NextResponse.json({ message: "Error fetching applicants" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { jobPostingId, firstName, lastName, email, phone, resumeUrl } = await req.json();

        if (!jobPostingId || !firstName || !lastName || !email) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const applicant = await prisma.applicant.create({
            data: {
                jobPostingId,
                firstName,
                lastName,
                email,
                phone,
                resumeUrl,
                status: "APPLIED"
            }
        });

        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: session.user.id,
                    userName: session.user.name || session.user.email?.split('@')[0] || 'User',
                    action: `Applied to job: ${jobPostingId} as ${firstName} ${lastName}`,
                    metadata: { applicantId: applicant.id, jobPostingId }
                }
            });
        } catch (err) {
            console.error('Failed to create activity for applicant', err);
        }

        return NextResponse.json(applicant, { status: 201 });
    } catch (error) {
        console.error("Error creating applicant:", error);
        return NextResponse.json({ message: "Error creating applicant" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id, status, notes } = await req.json();

        if (!id) {
            return NextResponse.json({ message: "Missing applicant ID" }, { status: 400 });
        }

        const dataToUpdate: any = {};
        if (status) dataToUpdate.status = status;
        if (notes !== undefined) dataToUpdate.notes = notes;

        const applicant = await prisma.applicant.update({
            where: { id },
            data: dataToUpdate
        });

        return NextResponse.json(applicant);
    } catch (error) {
        console.error("Error updating applicant:", error);
        return NextResponse.json({ message: "Error updating applicant" }, { status: 500 });
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
            return NextResponse.json({ message: "Missing applicant ID" }, { status: 400 });
        }

        await prisma.applicant.delete({ where: { id } });

        return NextResponse.json({ message: "Applicant deleted successfully" });
    } catch (error) {
        console.error("Error deleting applicant:", error);
        return NextResponse.json({ message: "Error deleting applicant" }, { status: 500 });
    }
}
