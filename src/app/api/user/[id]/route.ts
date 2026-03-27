import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Ensure the user deleting the account is the account owner or an Admin
        if (session.user.id !== id && session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Get user info before deletion for activity logging
        const userToDelete = await prisma.user.findUnique({
            where: { id: id },
            include: { employee: { select: { fullName: true } } }
        });

        if (!userToDelete) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Log activity before deletion
        await prisma.activity.create({
            data: {
                userId: session.user.id, // The user performing the deletion
                userName: session.user.name || session.user.email || 'Unknown',
                action: `Deleted account for ${userToDelete.employee?.fullName || userToDelete.username}`,
                metadata: { 
                    deletedUserId: userToDelete.id,
                    deletedUsername: userToDelete.username,
                    deletedBy: session.user.id
                }
            }
        });

        // Delete user (Cascade will handle associated Employee & Leave records based on Prisma schema)
        await prisma.user.delete({
            where: { id: id }
        });

        return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Failed to delete account:", error);
        return NextResponse.json({ message: "Error deleting account" }, { status: 500 });
    }
}

// allow profile updates (name/email) via PUT
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            console.log('[user PUT] no session');
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        console.log('[user PUT] params id:', id);
        console.log('[user PUT] session user id:', session.user.id);
        console.log('[user PUT] session user role:', session.user.role);

        if (session.user.id !== id && session.user.role !== 'ADMIN') {
            console.log('[user PUT] forbidden - user id mismatch or not admin');
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        console.log('[user PUT] body', body);
        const { name } = body;
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: 'No data provided for update' }, { status: 400 });
        }

        let updated;
        try {
            // update the user record
            updated = await prisma.user.update({
                where: { id },
                data: updateData,
            });
        } catch (err) {
            console.error('[user PUT] prisma update error', err);
            return NextResponse.json({ message: 'Database error updating profile' }, { status: 500 });
        }

        // If the name was updated, attempt to sync the employee.fullName too. Many UI views
        // use the employee table for display, so leaving it stale meant the new name
        // never appeared outside of the session object.
        if (name !== undefined) {
            try {
                await prisma.employee.update({
                    where: { userId: id },
                    data: { fullName: name },
                });
            } catch (err: any) {
                // ignore "record not found" errors, there may not be an employee
                if (err.code !== 'P2025') {
                    console.error('[user PUT] failed to sync employee fullName', err);
                }
            }
        }

        return NextResponse.json({ message: 'Profile updated', user: updated });
    } catch (error) {
        console.error('Failed to update user profile:', error);
        return NextResponse.json({ message: 'Error updating profile' }, { status: 500 });
    }
}
