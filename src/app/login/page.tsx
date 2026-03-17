'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const normalizedEmail = email.trim().toLowerCase();

            const result = await signIn('credentials', {
                email: normalizedEmail,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FA] items-center justify-center p-4 sm:p-8">
            <div className="flex w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden min-h-[500px]">
                {/* Left Panel - Branding & Decorative (Hidden on smaller screens) */}
                <div className="hidden lg:flex lg:w-1/2 bg-[#2563eb] relative overflow-hidden flex-col justify-center p-16 text-white">
                    <div className="relative z-10 flex flex-col pt-10 items-center text-center">
                        <h1 className="text-4xl font-bold mb-4 tracking-tight leading-tight shrink-0">
                            Welcome back!
                        </h1>
                        <p className="text-lg text-blue-100 font-medium">
                            You can sign in to access with your<br />existing account.
                        </p>
                    </div>
                </div>

                {/* Right Panel - Login Form */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-10 lg:p-12 relative">
                    <div className="w-full max-w-md mx-auto">
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
                            <p className="text-gray-500 lg:hidden text-sm">Please enter your details to sign in</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
                                <span className="text-red-500">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </span>
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <div className="relative flex items-center">
                                    <span className="absolute left-4 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Username or email"
                                        className="w-full rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors bg-white hover:border-gray-300 shadow-sm"
                                        style={{ paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="relative flex items-center">
                                    <span className="absolute left-4 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors bg-white hover:border-gray-300 shadow-sm"
                                        style={{ paddingLeft: '3rem', paddingRight: '3rem', paddingTop: '0.875rem', paddingBottom: '0.875rem' }}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 px-4">
                                <div className="flex items-center border border-transparent">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500 cursor-pointer select-none">
                                        Remember me
                                    </label>
                                </div>
                                <div className="text-sm">
                                    <Link href="/forgot-password" className="text-gray-500 hover:text-[#2563eb] hover:underline transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full !mt-8 flex justify-center py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#2563eb]/30"
                            >
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="mt-8 text-center text-sm text-gray-500">
                            New here?{' '}
                            <Link href="/register" className="text-[#2563eb] font-medium hover:underline">
                                Create an Account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
