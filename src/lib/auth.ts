import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// log when this module is imported
console.log("auth.ts loaded, setting up authOptions");

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const startTime = Date.now();
                console.log('Starting authentication...');

                // normalize input so users can type uppercase or add spaces
                const emailInput = credentials?.email?.trim().toLowerCase();
                const passwordInput = credentials?.password;

                if (!emailInput || !passwordInput) {
                    console.log('Authentication failed: missing credentials');
                    return null;
                }

                try {
                    console.log('Looking up user...');
                    const userLookupStart = Date.now();
                    const user = await prisma.user.findUnique({
                        where: { email: emailInput }
                    });
                    const userLookupTime = Date.now() - userLookupStart;
                    console.log(`User lookup took ${userLookupTime}ms`);

                    if (!user) {
                        console.log('Authentication failed: user not found');
                        return null;
                    }

                    console.log('Comparing password...');
                    const passwordCompareStart = Date.now();
                    const isPasswordValid = await bcrypt.compare(
                        passwordInput,
                        user.password
                    );
                    const passwordCompareTime = Date.now() - passwordCompareStart;
                    console.log(`Password comparison took ${passwordCompareTime}ms`);

                    if (!isPasswordValid) {
                        console.log('Authentication failed: invalid password');
                        return null;
                    }

                    const totalTime = Date.now() - startTime;
                    console.log(`Authentication successful, total time: ${totalTime}ms`);

                    // successful
                    return {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        name: user.name,
                    };
                } catch (error) {
                    console.error('Authentication error:', error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            const jwtStart = Date.now();
            if (trigger === "update" && session?.user?.name) {
                token.name = session.user.name;
            }
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.name = user.name;
            }
            const jwtTime = Date.now() - jwtStart;
            if (jwtTime > 100) { // Log if JWT callback takes more than 100ms
                console.log(`JWT callback took ${jwtTime}ms`);
            }
            return token;
        },
        async session({ session, token }) {
            const sessionStart = Date.now();
            if (session?.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.name = token.name;
            }
            const sessionTime = Date.now() - sessionStart;
            if (sessionTime > 100) { // Log if session callback takes more than 100ms
                console.log(`Session callback took ${sessionTime}ms`);
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
    },
    events: {
        // record successful sign-in (non-blocking)
        async signIn({ user, account, profile, isNewUser }) {
            // Don't block login with activity logging
            setImmediate(async () => {
                try {
                    await prisma.activity.create({
                        data: {
                            userId: user.id,
                            userName: (user.name || user.email || '').toString(),
                            action: 'Logged in',
                        }
                    });
                } catch (err) {
                    // Silently fail - don't block login
                    console.warn('Failed to record login activity (non-critical)', err);
                }
            });
        },
        // record sign-out (non-blocking)
        async signOut({ token }) {
            // Don't block logout with activity logging
            setImmediate(async () => {
                try {
                    await prisma.activity.create({
                        data: {
                            userId: token?.id as string | undefined,
                            userName: (token?.name || token?.email || '').toString(),
                            action: 'Logged out',
                        }
                    });
                } catch (err) {
                    // Silently fail - don't block logout
                    console.warn('Failed to record logout activity (non-critical)', err);
                }
            });
        }
    }
};
