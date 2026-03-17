import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employeeId');
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        let whereClause: any = {};
        if (employeeId) {
            whereClause.employeeId = employeeId;
            // If non-admin, ensure they only get their own payrolls
            if (session.user.role !== 'ADMIN') {
                const emp = await prisma.employee.findUnique({ where: { userId: session.user.id } });
                if (!emp || emp.id !== employeeId) {
                    return NextResponse.json({ message: "Unauthorized to view this payroll" }, { status: 403 });
                }
            }
        } else if (session.user.role !== 'ADMIN') {
            const emp = await prisma.employee.findUnique({ where: { userId: session.user.id } });
            if (emp) whereClause.employeeId = emp.id;
            else return NextResponse.json({ message: "Employee record not found" }, { status: 404 });
        }

        if (month) whereClause.month = Number(month);
        if (year) whereClause.year = Number(year);

        const payrolls = await prisma.payroll.findMany({
            where: whereClause,
            include: {
                employee: true,
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        });

        return NextResponse.json(payrolls);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching payrolls" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { employeeId, month, year, deductions = 0 } = await req.json();

        if (!employeeId || !month || !year) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Fetch salary
        const salary = await prisma.salary.findUnique({
            where: { employeeId }
        });

        if (!salary) {
            return NextResponse.json({ message: "Salary record not found for employee" }, { status: 404 });
        }

        const basicPay = salary.baseSalary;
        const allowance = salary.allowance;
        const netPay = basicPay + allowance - Number(deductions);

        const result = await prisma.payroll.upsert({
            where: {
                employeeId_month_year: {
                    employeeId,
                    month: Number(month),
                    year: Number(year)
                }
            },
            update: {
                basicPay,
                allowance,
                deductions: Number(deductions),
                netPay
            },
            create: {
                employeeId,
                month: Number(month),
                year: Number(year),
                basicPay,
                allowance,
                deductions: Number(deductions),
                netPay,
                status: "DRAFT"
            }
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating payroll:", error);
        return NextResponse.json({ message: "Error creating payroll" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id, status, paymentDate } = await req.json();

        if (!id) {
            return NextResponse.json({ message: "Missing payroll ID" }, { status: 400 });
        }

        const result = await prisma.payroll.update({
            where: { id },
            data: {
                status,
                paymentDate: paymentDate ? new Date(paymentDate) : null,
            }
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating payroll:", error);
        return NextResponse.json({ message: "Error updating payroll" }, { status: 500 });
    }
}
