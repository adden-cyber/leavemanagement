import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const salaries = await prisma.salary.findMany({
            include: {
                employee: true,
            }
        });

        return NextResponse.json(salaries);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching salaries" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { employeeId, baseSalary, allowance } = await req.json();

        if (!employeeId || (Math.sign(baseSalary) !== 1 && baseSalary !== 0)) {
            return NextResponse.json({ message: "Invalid data" }, { status: 400 });
        }

        const result = await prisma.salary.upsert({
            where: {
                employeeId: employeeId
            },
            update: {
                baseSalary: Number(baseSalary),
                allowance: Number(allowance) || 0,
            },
            create: {
                employeeId,
                baseSalary: Number(baseSalary),
                allowance: Number(allowance) || 0,
            }
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating/updating salary:", error);
        return NextResponse.json({ message: "Error updating salary" }, { status: 500 });
    }
}
