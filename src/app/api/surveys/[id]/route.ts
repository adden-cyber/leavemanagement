import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const survey = await prisma.survey.findUnique({
            where: { id },
            include: {
                questions: session.user.role === 'ADMIN' ? {
                    include: {
                        responses: {
                            include: { employee: true }
                        }
                    }
                } : true,
            },
        });

        if (!survey) {
            return NextResponse.json({ message: "Survey not found" }, { status: 404 });
        }

        // Check if the current user has already answered this survey
        let hasAnswered = false;
        if (session.user.role !== 'ADMIN') {
            const employee = await prisma.employee.findUnique({
                where: { userId: session.user.id }
            });
            if (employee) {
                // Check if any response exists from this employee for any question in this survey
                const questionIds = survey.questions.map(q => q.id);
                if (questionIds.length > 0) {
                    const responseCount = await prisma.surveyResponse.count({
                        where: {
                            questionId: { in: questionIds },
                            employeeId: employee.id
                        }
                    });
                    hasAnswered = responseCount > 0;
                }
            }
        }

        return NextResponse.json({ survey, hasAnswered });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch survey' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await prisma.survey.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Survey deleted successfully" });
    } catch (error) {
        console.error("Failed to delete survey:", error);
        return NextResponse.json(
            { error: 'Failed to delete survey' },
            { status: 500 }
        );
    }
}
