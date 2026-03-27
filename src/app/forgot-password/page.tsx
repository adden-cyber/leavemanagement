'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const res = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, newPassword }),
            });

            if (res.ok) {
                setStatus('success');
            } else {
                const data = await res.json();
                setErrorMessage(data.message || 'Something went wrong');
                setStatus('error');
            }
        } catch (error) {
            setErrorMessage('Network error');
            setStatus('error');
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FA] items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl p-8 sm:p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#7559e0] to-[#5939b8]"></div>

                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                    <p className="text-gray-500 text-sm">
                        Enter your username and a new password below.
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-gray-600 font-medium">Password updated successfully!</p>
                        <Link href="/login" className="inline-block mt-4 text-[#7559e0] font-medium hover:underline">
                            Return to Sign In
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {status === 'error' && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700 font-medium">
                                {errorMessage}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Username"
                                    className="w-full rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#7559e0] focus:ring-1 focus:ring-[#7559e0] transition-colors bg-white hover:border-gray-300 shadow-sm"
                                    style={{ paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem' }}
                                    required
                                />
                            </div>

                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New Password"
                                    className="w-full rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#7559e0] focus:ring-1 focus:ring-[#7559e0] transition-colors bg-white hover:border-gray-300 shadow-sm"
                                    style={{ paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem' }}
                                    minLength={6}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full !mt-8 flex justify-center py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#7559e0] to-[#5939b8] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7559e0] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#7559e0]/30"
                        >
                            {status === 'loading' ? 'Updating...' : 'Update Password'}
                        </button>

                        <div className="mt-8 text-center text-sm text-gray-500">
                            Remember your password?{' '}
                            <Link href="/login" className="text-[#7559e0] font-medium hover:underline">
                                Sign In
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
