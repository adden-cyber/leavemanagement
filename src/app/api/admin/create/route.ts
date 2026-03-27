import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        // Check if user is authenticated and is an admin
        const session = await getServerSession(authOptions);

        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json(
                { message: "Unauthorized. Admin access required." },
                { status: 403 }
            );
        }

        // Parse body
        let payload: any;
        try {
            payload = await req.json();
        } catch (parseErr) {
            console.error("Admin creation parse error:", parseErr);
            return NextResponse.json(
                { message: "Request body must be valid JSON" },
                { status: 400 }
            );
        }

        let { email, password, fullName } = payload;

        // Normalize email
        email = typeof email === 'string' ? email.trim().toLowerCase() : email;

        if (!email || !password || !fullName) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { message: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                name: fullName,
                password: hashedPassword,
                role: "ADMIN",
                employee: {
                    create: {
                        fullName,
                        position: "Administrator",
                        status: "PERMANENT",
                    } as any
                }
            } as any,
        });

        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: session.user.id,
                    userName: session.user.name || session.user.email?.split('@')[0] || 'Admin',
                    action: `Created admin account: ${fullName}`,
                    metadata: { newAdminId: user.id }
                }
            });
        } catch (err) {
            console.error('Failed to log activity for admin creation', err);
        }

        return NextResponse.json(
            { message: "Admin account created successfully", user: { id: user.id, email: user.email } },
            { status: 201 }
        );
    } catch (error) {
        console.error("Admin creation error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
