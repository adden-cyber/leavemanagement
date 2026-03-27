import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        console.log('DEBUG: DATABASE_URL:', process.env.DATABASE_URL);
        
        const user = await prisma.user.findUnique({
            where: { username: 'admin.lms' }
        });

        if (user) {
            return Response.json({
                success: true,
                user: {
                    username: user.username,
                    role: user.role,
                    hasPassword: !!user.password
                }
            });
        } else {
            return Response.json({
                success: false,
                message: 'User not found',
                databaseUrl: process.env.DATABASE_URL
            });
        }
    } catch (error: any) {
        return Response.json({
            success: false,
            error: error.message,
            databaseUrl: process.env.DATABASE_URL
        });
    }
}
