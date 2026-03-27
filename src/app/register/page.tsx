'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, password }),
            });

            if (res.ok) {
                setSuccess('Account created successfully! You can now log in.');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                const data = await res.json();
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FA] items-center justify-center p-4 sm:p-8">
            <div className="flex w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden min-h-[500px] flex-row-reverse">
                {/* Right Panel - Branding & Decorative (Hidden on smaller screens) - Reversed for Register */}
                <div className="hidden lg:flex lg:w-1/2 bg-[#2563eb] relative overflow-hidden flex-col justify-center p-16 text-white">
                    {/* Topographic Background Pattern SVG */}
                    <svg className="absolute inset-0 w-full h-full opacity-30 object-cover" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                        <path d="M-100,50 Q200,-50 300,300 T800,400" fill="none" stroke="currentColor" strokeWidth="1" />
                        <path d="M-100,80 Q200,-20 300,330 T800,430" fill="none" stroke="currentColor" strokeWidth="1" />
                        <path d="M-100,110 Q200,10 300,360 T800,460" fill="none" stroke="currentColor" strokeWidth="1" />
                        <path d="M-100,140 Q200,40 300,390 T800,490" fill="none" stroke="currentColor" strokeWidth="1" />
                        {/* Circle Accents */}
                        <circle cx="350" cy="150" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                        <circle cx="150" cy="450" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                        {/* Cross Accents */}
                        <path d="M 200,80 L 200,100 M 190,90 L 210,90" fill="none" stroke="currentColor" strokeWidth="2" />
                        <path d="M 400,380 L 400,400 M 390,390 L 410,390" fill="none" stroke="currentColor" strokeWidth="2" />
                        {/* Dot Pattern Grid Top Right */}
                        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="2" fill="currentColor" />
                        </pattern>
                        <rect x="75%" y="10%" width="60" height="140" fill="url(#dots)" opacity="0.6" />
                    </svg>

                    {/* Soft gradient blobs for background lighting */}
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#3b82f6] rounded-full mix-blend-screen filter blur-[60px] opacity-70"></div>
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#1d4ed8] rounded-full mix-blend-multiply filter blur-[60px] opacity-70"></div>

                    <div className="relative z-10 flex flex-col pt-10 text-center items-center">
                        <h1 className="text-4xl font-bold mb-4 tracking-tight leading-tight shrink-0">
                            Join us today!
                        </h1>
                        <p className="text-lg text-blue-100 font-medium">
                            Create an account to access<br />all our features.
                        </p>
                    </div>
                </div>

                {/* Left Panel - Register Form */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-10 lg:p-12 relative">
                    <div className="w-full max-w-md mx-auto">
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an Account</h2>
                            <p className="text-gray-500 lg:hidden text-sm">Please enter your details to register</p>
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

                        {success && (
                            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3">
                                <span className="text-green-500">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                <p className="text-sm text-green-700 font-medium">{success}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="relative flex items-center">
                                    <span className="absolute left-4 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Full Name"
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Username (e.g., john.doe)"
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
                                        placeholder="Password (Min. 8 chars)"
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

                            <div className="space-y-1.5">
                                <div className="relative flex items-center">
                                    <span className="absolute left-4 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
                                        className="w-full rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors bg-white hover:border-gray-300 shadow-sm"
                                        style={{ paddingLeft: '3rem', paddingRight: '3rem', paddingTop: '0.875rem', paddingBottom: '0.875rem' }}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full !mt-8 flex justify-center py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#2563eb]/30"
                            >
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </button>
                        </form>

                        <div className="mt-8 text-center text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link href="/login" className="text-[#2563eb] font-medium hover:underline">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
