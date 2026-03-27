'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useDashboardCache } from '@/lib/DashboardCacheContext';
import { apiUrl } from '@/lib/api';

export default function SettingsView() {
    const { data: session, update: updateSession } = useSession();
    const { clearCache } = useDashboardCache();
    const isAdmin = session?.user?.role === 'ADMIN';
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [nameInput, setNameInput] = useState<string>('');
    const [icNoInput, setIcNoInput] = useState<string>('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
    const [showAdminForm, setShowAdminForm] = useState(false);
    const [adminFormData, setAdminFormData] = useState({ email: '', password: '', name: '' });
    const [successMessage, setSuccessMessage] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSystemInfo, setShowSystemInfo] = useState(false);

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            setTheme(storedTheme as 'light' | 'dark');
            if (storedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            }
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        }
    }, []);

    // sync name field when session loads
    useEffect(() => {
        if (session?.user?.name) {
            setNameInput(session.user.name);
        }
    }, [session?.user?.name]);

    // Fetch employee profile info (including IC number)
    useEffect(() => {
        const username = (session?.user as any)?.username || session?.user?.email;
        if (!username) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch(apiUrl('/api/profile'));
                if (!res.ok) return;
                const data = await res.json();
                if (data.icNo !== undefined) {
                    setIcNoInput(data.icNo || '');
                }
                // keep name in sync if we don't yet have one
                if (!session?.user?.name && data.fullName) {
                    setNameInput(data.fullName);
                }
            } catch (err) {
                console.warn('Failed to fetch profile data', err);
            }
        };

        fetchProfile();
    }, [session?.user?.email]);

    // Refetch profile data when edit modal opens
    useEffect(() => {
        const username = (session?.user as any)?.username || session?.user?.email;
        if (!showEditModal || !username) return;

        console.log('Edit modal opened, fetching profile data...');
        const fetchProfile = async () => {
            try {
                const res = await fetch(apiUrl('/api/profile'));
                if (!res.ok) {
                    console.log('Profile fetch failed:', res.status);
                    return;
                }
                const data = await res.json();
                console.log('Fetched profile data:', data);
                if (data.icNo !== undefined) {
                    console.log('Setting IC number to:', data.icNo || '');
                    setIcNoInput(data.icNo || '');
                }
            } catch (err) {
                console.warn('Failed to fetch profile data', err);
            }
        };

        fetchProfile();
    }, [showEditModal, session?.user?.email]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleDeleteAccount = async () => {
        if (!session?.user?.id) {
            alert("No user session found.");
            return;
        }

        const confirmDelete = window.confirm(
            "Are you absolutely sure you want to delete your account? This action is permanent and will delete all your associated data, including leave requests and attendance records."
        );

        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/user/${session.user.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert("Account successfully deleted.");
                signOut({ callbackUrl: '/login' });
            } else {
                const data = await res.json();
                alert(data.message || "Failed to delete account");
                setIsDeleting(false);
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            alert("An error occurred. Please try again later.");
            setIsDeleting(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!session?.user?.id) {
            alert('Session not ready. Please try again later.');
            return;
        }
        if (nameInput.trim() === '') {
            setProfileError('Name cannot be empty');
            return;
        }
        setProfileError('');
        setIsSavingProfile(true);
        try {
            const res = await fetch(`/api/user/${session.user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: nameInput.trim() }),
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch (err) {
                console.warn('Failed to parse /api/user response as JSON', err);
            }

            // Also update the employee profile record (e.g., IC number)
            console.log('About to call /api/profile with IC number:', icNoInput.trim());
            const profileRes = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ icNo: icNoInput.trim() }),
            });

            console.log('Profile update response status:', profileRes.status);
            console.log('IC number being saved:', icNoInput.trim());

            let profileData: any = {};
            try {
                const profileText = await profileRes.text();
                console.log('Profile response text:', profileText);
                profileData = JSON.parse(profileText);
                console.log('Profile response data:', profileData);
            } catch (err) {
                console.warn('Failed to parse /api/profile response as JSON', err);
            }

            if (res.ok && profileRes.ok) {
                console.log('Both API calls succeeded - IC number should be saved');
                // make sure the local input is trimmed and up‑to‑date
                setNameInput(nameInput.trim());
                setSuccessMessage('Profile updated successfully!');
                // Try to update the session object so UI that reads session.user.name
                // will reflect the new value immediately. NextAuth expects the `user`
                // field to be updated rather than passing a top‑level name.
                try {
                    await updateSession({
                        user: {
                            ...(session?.user || {}),
                            name: nameInput.trim(),
                        },
                    });
                } catch (err) {
                    console.warn('updateSession call failed', err);
                }
                // Clear dashboard cache so name appears everywhere instantly
                clearCache();
                // Close modal after success
                setTimeout(() => {
                    setShowEditModal(false);
                    setSuccessMessage('');
                    // Force a hard refresh of the session to update sidebar and any
                    // server‑rendered content that may still show the old name.
                    window.location.reload();
                }, 800);
            } else {
                console.log('API call failed:', { userRes: res.status, profileRes: profileRes.status });
                console.log('User API error:', data);
                console.log('Profile API error:', profileData);
                setProfileError(
                    data?.message ||
                        data?.error ||
                        profileData?.message ||
                        profileData?.error ||
                        `Failed to update profile (${res.status}/${profileRes.status})`
                );
            }
        } catch (error: any) {
            console.error('Error saving profile:', error);
            setProfileError(
                error?.message ||
                    'An error occurred. Please try again later.'
            );
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!adminFormData.email || !adminFormData.password || !adminFormData.name) {
            alert('Please fill in all fields');
            return;
        }

        if (adminFormData.password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        setIsCreatingAdmin(true);
        try {
            const res = await fetch('/api/admin/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: adminFormData.email,
                    password: adminFormData.password,
                    fullName: adminFormData.name,
                }),
            });

            if (res.ok) {
                setSuccessMessage('successfully created a new admin account! log out to enter the new admin account');
                setShowAdminForm(false);
                setAdminFormData({ email: '', password: '', name: '' });
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to create admin account');
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            alert('An error occurred. Please try again later.');
        } finally {
            setIsCreatingAdmin(false);
        }
    };

    return (
        <div className="space-y-8 max-w-lg mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Manage your app preferences and account settings.</p>
            </div>

            {/* Profile Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-600 shadow-sm transition-colors">
                <div className="grid grid-cols-[auto_auto] items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">👤</span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profile</h3>
                    </div>
                    <div className="text-right">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="px-4 py-2 text-base bg-[#7559e0] text-white font-bold rounded-lg hover:bg-[#6448cc] transition-colors disabled:opacity-50"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>

            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-md w-full border-2 border-slate-200 dark:border-slate-600">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-600 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Profile</h2>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setProfileError('');
                                }}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={e => setNameInput(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7559e0]"
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">IC Card Number</label>
                                <input
                                    type="text"
                                    value={icNoInput}
                                    onChange={e => setIcNoInput(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7559e0]"
                                    placeholder="Enter your IC number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                <div className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed">
                                    {session?.user?.email || 'Not set'}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Email cannot be changed</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Role</label>
                                <div className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                        {session?.user?.role || 'Employee'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Only admins can change roles</p>
                            </div>

                            {profileError && (
                                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-300 p-3 rounded-xl text-sm">
                                    {profileError}
                                </div>
                            )}

                            {successMessage && (
                                <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-800 dark:text-green-300 p-3 rounded-xl text-sm">
                                    {successMessage}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-200 dark:border-slate-600 flex gap-3">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="flex-1 px-4 py-2 bg-[#7559e0] text-white font-bold rounded-xl hover:bg-[#6448cc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingProfile ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setProfileError('');
                                }}
                                disabled={isSavingProfile}
                                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-xl hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Appearance Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-600 shadow-sm transition-colors">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🎨</span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Light/Dark Mode</h3>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#7559e0] focus:ring-offset-2 ${theme === 'dark' ? 'bg-[#7559e0]' : 'bg-slate-300'
                            }`}
                        aria-pressed={theme === 'dark'}
                    >
                        <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition shadow-sm ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-800 dark:text-green-300 p-4 rounded-xl">
                    {successMessage}
                </div>
            )}

            {/* Admin Section */}
            {isAdmin && (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-600 shadow-sm transition-colors">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">👤</span>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Admin Tools</h3>
                        </div>
                        {!showAdminForm && (
                            <button
                                onClick={() => setShowAdminForm(true)}
                                className="px-4 py-2 bg-[#7559e0] text-white font-bold rounded-lg hover:bg-[#6448cc] transition-colors focus:ring-2 focus:ring-[#7559e0] focus:outline-none dark:bg-[#7559e0] dark:hover:bg-[#6448cc]"
                            >
                                Create New Admin Account
                            </button>
                        )}
                    </div>

                    {showAdminForm && (
                        <form onSubmit={handleCreateAdmin} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={adminFormData.name}
                                    onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                                    placeholder="Enter full name"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7559e0]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={adminFormData.email}
                                    onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                                    placeholder="Enter email address"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7559e0]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={adminFormData.password}
                                    onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                                    placeholder="Enter password (minimum 6 characters)"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7559e0]"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isCreatingAdmin}
                                    className="px-5 py-2.5 bg-[#7559e0] text-white font-bold rounded-xl hover:bg-[#6448cc] transition-colors focus:ring-2 focus:ring-[#7559e0] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreatingAdmin ? 'Creating...' : 'Create Admin'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAdminForm(false);
                                        setAdminFormData({ email: '', password: '', name: '' });
                                    }}
                                    className="px-5 py-2.5 bg-slate-200 text-slate-800 font-bold rounded-xl hover:bg-slate-300 transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* System Information Section with toggle */}
            <div className="space-y-2">
                <button
                    onClick={() => setShowSystemInfo(prev => !prev)}
                    className="w-full flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-600 shadow-sm transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">ℹ️</span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">System Information</h3>
                    </div>
                    <svg
                        className={`w-5 h-5 text-slate-700 dark:text-slate-300 transition-transform ${showSystemInfo ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {showSystemInfo && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border-2 border-slate-200 dark:border-slate-600 shadow-sm transition-colors">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Version</span>
                                <span className="text-sm text-slate-900 dark:text-white font-mono">0.1.0</span>
                            </div>
                            
                            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Framework</span>
                                <span className="text-sm text-slate-900 dark:text-white">Next.js 16.1.6</span>
                            </div>
                            
                            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Database</span>
                                <span className="text-sm text-slate-900 dark:text-white">SQLite with Prisma</span>
                            </div>
                            
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Build Date</span>
                                <span className="text-sm text-slate-900 dark:text-white font-mono">{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Danger Zone Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border-2 border-red-200 dark:border-red-600 shadow-sm transition-colors min-h-[130px] flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">⚠️</span>
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Danger Zone</h3>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 flex-1">
                    <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">Delete Account</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                            Permanently remove your account and all associated data. This action cannot be undone.
                        </p>
                    </div>

                    <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="whitespace-nowrap px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 font-bold rounded-xl hover:bg-red-100 hover:border-red-300 transition-all focus:ring-2 focus:ring-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                </div>
            </div>
        </div>
    );
}
