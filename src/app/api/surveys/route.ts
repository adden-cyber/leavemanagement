import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const surveys = await prisma.survey.findMany({
            include: {
                questions: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(surveys);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch surveys' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Ensure questions exist
        const questionsData = body.questions && body.questions.length > 0
            ? body.questions.map((q: any) => ({
                questionText: q.questionText,
                type: q.type || 'TEXT',
                options: q.options ? JSON.stringify(q.options) : null
            }))
            : [];

        const survey = await prisma.survey.create({
            data: {
                title: body.title,
                description: body.description,
                status: body.status || 'OPEN',
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
                questions: {
                    create: questionsData
                }
            },
            include: {
                questions: true
            }
        });
        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: session.user.id,
                    userName: session.user.name || session.user.email?.split('@')[0] || 'Admin',
                    action: `Created survey: ${body.title}`,
                    metadata: { surveyId: survey.id }
                }
            });
        } catch (err) {
            console.error('Failed to create activity for survey', err);
        }

        return NextResponse.json(survey);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to create survey' },
            { status: 500 }
        );
    }
}
