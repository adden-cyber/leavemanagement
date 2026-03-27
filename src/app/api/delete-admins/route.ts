import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const usernames = ['admin@hrsystem.com', 'admin@songyinroro.com']; // old emails, but now usernames
        let deleted = [];
        for (const username of usernames) {
            try {
                await prisma.user.delete({ where: { username } });
                deleted.push(username);
            } catch (e: any) {
                // Ignore if not exists
            }
        }
        return NextResponse.json({ message: "Done", deleted });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
