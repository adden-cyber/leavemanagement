import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const employees = await prisma.employee.findMany({
            select: {
                id: true,
                fullName: true,
                position: true,
                department: true,
                user: { select: { id: true, email: true, role: true } },
            },
            orderBy: { fullName: 'asc' }
        });
        
        // Filter out admin users
        const nonAdminEmployees = employees.filter(emp => emp.user?.role !== 'ADMIN');
        
        return NextResponse.json(nonAdminEmployees);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch directory' },
            { status: 500 }
        );
    }
}
