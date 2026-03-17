import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const survey = await prisma.survey.findUnique({
            where: { id },
            include: { questions: true }
        });

        if (!survey) {
            return NextResponse.json({ message: "Survey not found" }, { status: 404 });
        }

        const body = await request.json();
        const answers = body.answers; // Expecting { questionId: string, answerText: string }[]

        if (!answers || !Array.isArray(answers)) {
            return NextResponse.json({ message: "Invalid answers format" }, { status: 400 });
        }

        // Validate question ids belong to this survey
        const validQuestionIds = new Set(survey.questions.map(q => q.id));
        const invalid = answers.find((a: any) => !validQuestionIds.has(a.questionId));
        if (invalid) {
            return NextResponse.json({ message: "One or more question IDs are invalid for this survey" }, { status: 400 });
        }

        // Prepare data for bulk insert and skip duplicates to avoid unique constraint failures
        const responsesData = answers.map((answer: any) => ({
            questionId: answer.questionId,
            employeeId: employee.id,
            answerText: answer.answerText ?? null,
        }));

        try {
            console.log('Creating survey responses:', responsesData);
            // Use a transaction to insert all responses, catching duplicate errors
            const results = await Promise.allSettled(
                responsesData.map((data) =>
                    prisma.surveyResponse.create({
                        data,
                    })
                )
            );
            
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            console.log(`Survey responses created: ${succeeded} succeeded, ${failed} skipped (duplicates)`);
        } catch (err: any) {
            console.error('Failed to create survey responses:', err?.message || err);
            console.error('Error details:', err);
            return NextResponse.json({ message: `Failed to save responses: ${err?.message}` }, { status: 500 });
        }

        return NextResponse.json({ message: "Survey answers submitted successfully" });
    } catch (error: any) {
        console.error('Outer error:', error?.message || error);
        console.error('Full error:', error);
        return NextResponse.json(
            { error: `Failed to submit responses: ${error?.message}` },
            { status: 500 }
        );
    }
}
