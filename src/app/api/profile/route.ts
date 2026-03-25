import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Using correct authOptions import
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                employee: true,
            },
        });

        if (!user || !user.employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...user.employee,
            email: user.email,
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { bio, profileImage, bannerImage, icNo } = data;

        // First get the user to find their employee record
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true }
        });

        if (!user || !user.employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        const updateData: any = {};
        if (bio !== undefined) updateData.bio = bio;
        if (profileImage !== undefined) updateData.profileImage = profileImage;
        if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
        if (icNo !== undefined) updateData.icNo = icNo;

        console.log('Updating employee with data:', updateData);

        // Update the employee directly
        const updatedEmployee = await prisma.employee.update({
            where: { id: user.employee.id },
            data: updateData
        });

        console.log('Updated employee:', updatedEmployee);

        return NextResponse.json({ 
            employee: {
                ...updatedEmployee,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
