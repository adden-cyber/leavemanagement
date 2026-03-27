import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { username, newPassword } = await req.json();

        if (!username || !newPassword) {
            return NextResponse.json(
                { message: "Missing username or new password" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { username },
            data: { password: hashedPassword }
        });

        return NextResponse.json(
            { message: "Password updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { message: "Internal server error", detail: (error as any)?.message || "unknown" },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Use POST to reset password' }, { status: 405 });
}
