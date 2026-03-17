import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const emails = ['admin@hrsystem.com', 'admin@songyinroro.com'];
        let deleted = [];
        for (const email of emails) {
            try {
                await prisma.user.delete({ where: { email } });
                deleted.push(email);
            } catch (e: any) {
                // Ignore if not exists
            }
        }
        return NextResponse.json({ message: "Done", deleted });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
