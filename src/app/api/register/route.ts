import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        // parse body and handle invalid JSON explicitly so callers
        // don't run into a generic 500 from the outer try/catch.
        let payload: any;
        try {
            payload = await req.json();
        } catch (parseErr) {
            console.error("Registration parse error:", parseErr);
            return NextResponse.json(
                { message: "Request body must be valid JSON" },
                { status: 400 }
            );
        }

        let { email, password, name, role } = payload;

        // normalize address to reduce casing/spacing errors
        email = typeof email === 'string' ? email.trim().toLowerCase() : email;

        if (!email || !password || !name) {
            return NextResponse.json(
                { message: "Missing required fields" },
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
                password: hashedPassword,
                role: role || "EMPLOYEE",
                employee: {
                    create: {
                        fullName: name,
                        position: "TBD",
                        department: "worker",
                    }
                }
            },
        });

        // Log activity asynchronously without blocking the response
        prisma.activity.create({
            data: {
                userId: user.id,
                userName: name,
                action: `Registered account`,
                metadata: { userId: user.id }
            }
        }).catch(err => {
            console.error('Failed to log activity for registration', err);
        });

        return NextResponse.json(
            { message: "User created successfully", user: { id: user.id, email: user.email } },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
